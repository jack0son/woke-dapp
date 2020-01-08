import React, { useState, useEffect, useMemo } from 'react';
import { useWeb3Context } from '../web3context'
import dayjs from 'dayjs';
import { timeSince } from '../../lib/utils';


// TODO indexed strings do not work in web3js 1.2.1 
// https://github.com/ethereum/web3.js/issues/3053
export default function(userId, twitterUsers, blockCache) {
	const {
		web3,
		account,
		useEvents
	} = useWeb3Context();
	const [eventList, setEventList] = useState([]);
	const userIds = twitterUsers.state.ids;
	const setUserIds = twitterUsers.setIds;

	// @notice web3js 2.0 will not require hashing of indexed filter param
	const userIdHash = useMemo(() => web3.utils.keccak256(userId), [userId]);

	let sends = useEvents('WokeToken', 'Tx',
		useMemo(() => (
			{
				//filter: { fromId_ind: userIdHash },
				//filter: { fromId_ind: userId },
				//filter: { fromId: userId },
				fromBlock: 0
			}
		),
			[account, userIdHash])
	);
	// Manual filter to account for issue 3053
	sends = sends.filter(event => event.returnValues.fromId == userId);

	let receives = useEvents('WokeToken', 'Tx',
		useMemo(() => (
			{
				//filter: { toId_ind: userIdHash },
				//filter: { toId_ind: userIdHash },
				//filter: { toId: userId },
				fromBlock: 0
			}
		),
			[account, userIdHash])
	);
	// Manual filter to account for issue 3053
	receives = receives.filter(event => event.returnValues.toId == userId);

	let newEvents = [];
	let newUserIds = [];
	let blocks = [];

	const parseEvents = (events, isSend) => {
		newEvents = newEvents.concat(events.map(event => {
			let id = event.returnValues[isSend ? 'toId' : 'fromId'];
			if(!userIds.includes(id)) {
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
			setUserIds(userIds => [...userIds, ...newUserIds]);
		}

		if(newEvents.length > 0) {
			newEvents.sort((a,b) => b.blockNumber - a.blockNumber);
		}
		setEventList(newEvents);
	}

	// Link events to block and user data as it becomes available
	useEffect(() => {
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
	}, [eventList, blockCache.blockNumbers.length, twitterUsers.state.data]);

	//console.dir(eventList);

	return eventList;
}
