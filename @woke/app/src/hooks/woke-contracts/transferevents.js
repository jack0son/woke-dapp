import React, { useState, useEffect, useMemo, useRef, useCallback} from 'react';
import { useWeb3Context } from '../web3context'
import { useTwitterContext } from '../twitter/index.js'

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

	let newEvents = [];
	let newUserIds = [];
	let newBlockNumbers = [];

	const txHashList = eventList.map(e => e.transactionHash);

	const attachEventMetaData = (event) => {
		event.block = blockCache.blocks[event.blockNumber];
		if(event.block) {
			event.timestamp = dayjs.unix(event.block.timestamp)
			event.timeSince = timeSince(event.timestamp);
		}

		if(twitterUsers.state.data[event.counterParty.id]) {
			event.counterParty = twitterUsers.state.data[event.counterParty.id];
		}
	}

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
				attachEventMetaData(event);

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

	// Link events to block and user data as it becomes available.
	// Use a ref here to decouple effect execution from changes to blockCache.
	const numBlocks = useRef(blockCache.blockNumbers.length);
	useEffect(() => {
		function attach(event) {
			event.block = blockCache.blocks[event.blockNumber];
			if(event.block) {
				event.timestamp = dayjs.unix(event.block.timestamp)
				event.timeSince = timeSince(event.timestamp);
			}
		}

		if(blockCache.blockNumbers.length > numBlocks.current) {
			numBlocks.current = blockCache.blockNumbers.length;

			setEventList(eventList => {
				eventList.forEach(event => {
					attach(event)
				});
				return eventList;
			})
		}
	}, [blockCache.blockNumbers, blockCache.blocks])//false, eventList, blockCache, twitterUsers.state.data]);

	// Attach twitter user data
	const userDataLen = useRef(twitterUsers.state.dataLength);
	useEffect(() => {
		function attach(event) {
			if(twitterUsers.state.data[event.counterParty.id]) {
				event.counterParty = twitterUsers.state.data[event.counterParty.id];
			}
		}

		if(twitterUsers.state.dataLength > userDataLen.current) {
			userDataLen.current = twitterUsers.state.dataLength;
			setEventList(eventList => {
				eventList.forEach(event => {
					attach(event)
				});
				return eventList;
			})
		}
	}, [twitterUsers.state.data, twitterUsers.state.dataLength]);

	return eventList;
}
