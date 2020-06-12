import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWeb3Context } from '../web3context'
import dayjs from 'dayjs';
import { timeSince } from '../../lib/utils';
import { useTwitterContext } from '../twitter/index.js'


export default function(blockCache) {
	const {
		account,
		useEvents,
		useContract,
	} = useWeb3Context();
	const twitterUsers = useTwitterContext().userList;
	const [eventList, setEventList] = useState([]);

	const userRegistry = useContract('UserRegistry');

	// TODO: use indexed strings on smart-contract to look up by user id
	let bonusEvents = useEvents('UserRegistry', 'Bonus',
		useMemo(() => (
			{
				filter: { referrer: account },
				fromBlock: 0
			}
		),
			[account])
	);

	useEffect(() => {
	let newEvents = []
	let newUserIds = [];
	let blocks = [];
	const parseEvents = (events) => Promise.all(
		events.map(event => userRegistry.methods.getUser(event.returnValues.claimer).call()
			.then(id => {
				if(!twitterUsers.state.ids.includes(id)) {
					newUserIds.push(id);
				}
				//if(!blockCache.blockNumbers.includes(event.blockNumber)) {
				//}
				blocks.push(event.blockNumber);
				newEvents.push({
					...event, 
					type: 'receive',
					counterParty: {
						id: id,
					}
				})
			})
		)
	);

		async function updateEvents() {
			if(bonusEvents) {
				await parseEvents(bonusEvents);
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
		}

		updateEvents();

	}, [bonusEvents]);



	// Link events to block and user data as it becomes available
	const numBlocks = useRef(blockCache.blockNumbers.length);
	const numTwitterUsers = useRef(twitterUsers.state.data.length);
	useEffect(() => {
		if(twitterUsers.state.data.length > numTwitterUsers.current || blockCache.blockNumbers.length > numBlocks.current) {
			console.log('Updating bonus event metadata...');
			numBlocks.current = blockCache.blockNumbers.length;
			numTwitterUsers.current = twitterUsers.state.data.length;
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
	}, [eventList, blockCache, twitterUsers.state.data, twitterUsers.state.dataLength]);

	return eventList;
}
