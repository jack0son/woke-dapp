import React, { useState, useEffect, useMemo, useRef, useCallback} from 'react';
import { useWeb3Context } from '../web3context';
import { useTwitterContext } from '../twitter/index.js';
import useEventMetaData from './events-metadata';

import dayjs from 'dayjs';
import { timeSince } from '../../lib/utils';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// TODO indexed strings do not work in web3js 1.2.4
// https://github.com/ethereum/web3.js/issues/3053
export default function(userId, blockCache) {
	const {
		account,
		useEvents,
		web3,
	} = useWeb3Context();
	const twitterUsers = useTwitterContext().userList;
	const [eventList, setEventList] = useState([]);

	const eventMetadata = useEventMetaData(blockCache, eventList, setEventList);

	// @notice web3js 2.0 will not require hashing of indexed filter param
	//const userIdHash = useMemo(() => web3.utils.keccak256(userId), [userId]);

	let sends = useEvents('UserRegistry', 'Tx',
		useMemo(() => (
			{
				filter: { from: account },
				fromBlock: 0
			}
		), [account]),
	);

	// Manual filter to account for issue 3053
	//sends = sends.filter(event => event.returnValues.fromId === userId);

	let receives = useEvents('UserRegistry', 'Tx',
		useMemo(() => {
			return {
				filter: { to: account },
				fromBlock: 0
			}
		}, [account])
	);
	// Manual filter to account for issue 3053
	//receives = receives.filter(event => event.returnValues.toId === userId);

	// Have to search for all user's pre-claim events due to Issue #21
	let preClaims = useEvents('UserRegistry', 'Tx',
		useMemo(() => {
			return {
				filter: { to: ZERO_ADDRESS },
				fromBlock: 0
			}
		}, [account])
	).filter(event => event.returnValues.toId === userId); // @fix ineffient at scale

	useEffect(() => {
		let newEvents = [];
		let newUserIds = [];
		let newBlockNumbers = [];

		const txHashList = eventList.map(e => e.transactionHash);

		const parseEvents = (events, isSend) => {
			newEvents = newEvents.concat(
				events
				.filter(event => !txHashList.includes(event.transactionHash))
				.map(event => {
					const id = event.returnValues[isSend ? 'toId' : 'fromId'];
					// TODO use a merge callback on the twitterUsers hook instead
					if(!twitterUsers.state.ids.includes(id)) {
						newUserIds.push(id);
					}
					newBlockNumbers.push(event.blockNumber);

					event = {
						...event,
						type: isSend ? 'send' : 'receive',
						counterParty: {
							id: id,
						}
					}
					eventMetadata.attach(event);

					return event;
				})
			);
		}

		if(sends.length > 0) {
			parseEvents(sends, true);
		}

		if(receives.length > 0) {
			parseEvents(receives, false);
		}

		if(preClaims.length > 0) {
			parseEvents(preClaims, false);
		}

		if(newEvents.length > 0) {

			if(newUserIds.length > 0) {
				twitterUsers.appendIds(newUserIds);
			}

			if(newEvents.length > 0) {
				//newEvents.sort((a,b) => b.blockNumber - a.blockNumber);
			}
			//attachEventMetaData(newEvents);
			blockCache.mergeBlockNumbers(newBlockNumbers);
			setEventList([...eventList, ...newEvents].sort((a,b) => b.blockNumber - a.blockNumber));
		}

	}, [sends, receives, preClaims, eventList, eventMetadata]);

	return eventList;
}
