import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWeb3Context } from '../web3context'
import dayjs from 'dayjs';
import { timeSince } from '../../lib/utils';
import { useTwitterContext } from '../twitter/index.js'
import useEventMetaData from './events-metadata';


export default function(blockCache) {
	const {
		account,
		useEvents,
		useContract,
	} = useWeb3Context();
	const twitterUsers = useTwitterContext().userList;
	const [eventList, setEventList] = useState([]);
	const eventMetadata = useEventMetaData(blockCache, eventList, setEventList);
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
					newEvents.push(eventMetadata.attach({
						...event, 
						type: 'receive',
						counterParty: {
							id: id,
						}
					}));
				})
			)
		);

		async function updateEvents() {
			const txHashList = eventList.map(e => e.transactionHash);
			if(bonusEvents.length > eventList.length) {
				await parseEvents(bonusEvents.filter(e => !txHashList.includes(e)));
			}
			if(newEvents.length > 0) {
				blockCache.addBlocks(blocks);

				if(newUserIds.length > 0) {
					twitterUsers.appendIds(newUserIds);
				}

				if(newEvents.length > 0) {
					newEvents.sort((a,b) => b.blockNumber - a.blockNumber);
				}

				setEventList([...eventList, ...newEvents]);
			}
		}

		updateEvents();

	}, [bonusEvents, eventList, eventMetadata]);

	return eventList;
}
