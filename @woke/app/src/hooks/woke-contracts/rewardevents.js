import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWeb3Context } from '../web3context'
import dayjs from 'dayjs';
import { timeSince } from '../../lib/utils';
import { useTwitterContext } from '../twitter/index.js'


export default function(blockCache) {
	const {
		account,
		useEvents
	} = useWeb3Context();
	const twitterUsers = useTwitterContext().userList;
	const [eventList, setEventList] = useState([]);

	// TODO: use indexed strings on smart-contract to look up by user id
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
			if(!twitterUsers.state.ids.includes(id)) {
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
			twitterUsers.appendIds(newUserIds);
		}

		if(newEvents.length > 0) {
			newEvents.sort((a,b) => b.blockNumber - a.blockNumber);
		}

		setEventList(newEvents);
	}

	// Link events to block and user data as it becomes available
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
