import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWeb3Context } from '../web3context'
import { useTwitterContext } from '../twitter/index.js'

import dayjs from 'dayjs';
import { timeSince } from '../../lib/utils';


// TODO indexed strings do not work in web3js 1.2.4
// https://github.com/ethereum/web3.js/issues/3053
export default function(userId, blockCache) {
	const {
		account,
		useEvents
	} = useWeb3Context();
	const twitterUsers = useTwitterContext().userList;
	const [eventList, setEventList] = useState([]);

	// @notice web3js 2.0 will not require hashing of indexed filter param
	//const userIdHash = useMemo(() => web3.utils.keccak256(userId), [userId]);

	let sends = useEvents('WokeToken', 'Tx',
		useMemo(() => (
			{
				filter: { from: account },
				fromBlock: 0
			}
		),
			[account])
	);
	// Manual filter to account for issue 3053
	sends = sends.filter(event => event.returnValues.fromId === userId);

	let receives = useEvents('WokeToken', 'Tx',
		useMemo(() => {
			return {
				filter: { to: account },
				fromBlock: 0
			}
		},
			[account])
	);
	// Manual filter to account for issue 3053
	receives = receives.filter(event => event.returnValues.toId === userId);

	let newEvents = [];
	let newUserIds = [];
	let blocks = [];

	const parseEvents = (events, isSend) => {
		newEvents = newEvents.concat(events.map(event => {
			let id = event.returnValues[isSend ? 'toId' : 'fromId'];
			if(!twitterUsers.state.ids.includes(id)) {
				newUserIds.push(id);
			}

			blocks.push(event.blockNumber);

			return {
				...event, 
				type: isSend ? 'send' : 'receive',
				counterParty: {
					id: id,
				}
			}
		}));
	}

	if(sends.length > 0) {
		parseEvents(sends, true);
	}

	if(receives.length > 0) {
		parseEvents(receives, false);
	}

	if(newEvents.length > eventList.length) {
		blockCache.addBlocks(blocks);

		if(newUserIds.length > 0) {
			twitterUsers.appendIds(newUserIds);
		}

		if(newEvents.length > 0) {
			newEvents.sort((a,b) => b.blockNumber - a.blockNumber);
		}
		setEventList(newEvents);
	}

	// Link events to block and user data as it becomes available.
	// Use a ref here to decouple effect execution from changes to blockCache.
	const numBlocks = useRef(blockCache.blockNumbers.length);
	useEffect(() => {
		if(blockCache.blockNumbers.length > numBlocks.current) {
			numBlocks.current = blockCache.blockNumbers.length;

			setEventList(eventList => {
				eventList.forEach(event => {
					event.block = blockCache.blocks[event.blockNumber];
					if(event.block) {
						event.timestamp = dayjs.unix(event.block.timestamp)
						event.timeSince = timeSince(event.timestamp);
					}

					if(twitterUsers.state.data[event.counterParty.id]) {
						event.counterParty = twitterUsers.state.data[event.counterParty.id];
					}

				});

				return eventList;
			})
		}
	}, [eventList, blockCache, twitterUsers.state.data]);

	return eventList;
}
