import React, { useState, useEffect, useMemo } from 'react';
import { useWeb3Context } from '../web3context'
import dayjs from 'dayjs';
import { timeSince } from '../../lib/utils';


export default function(twitterUsers, blockCache) {
	const {
		web3,
		account,
		useEvents
	} = useWeb3Context();
	const [eventList, setEventList] = useState([]);
	const userIds = twitterUsers.state.ids;
	const setUserIds = twitterUsers.setIds;

	// Cannot use indexed strings on drizzle as it using an old web3 beta
	let rewardEvents = useEvents('WokeToken', 'Reward',
		useMemo(() => (
			{
				filter: { referrer: account },
				fromBlock: 0
			}
		),
			[account])
	);

	let newUserIds = [];
	let newEvents = []
	let blocks = [];

	const parseEvents = (events) => {
		newEvents = newEvents.concat(events.map(event => {
			let id = event.returnValues.claimerId;
			if(!userIds.includes(id)) {
				newUserIds.push(id);
			}

			//if(!blockCache.blockNumbers.includes(event.blockNumber)) {
			blocks.push(event.blockNumber);
			//}

			return {
				...event, 
				type: 'receive',
				counterParty: {
					id: id,
				}
			}
		}));
	}

	if(rewardEvents) {
		parseEvents(rewardEvents);
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

	return eventList;
}
