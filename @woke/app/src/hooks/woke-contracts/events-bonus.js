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

	// @fix work around for use effect not deepcomparing the event list items
	const [deep, setDeep] = useState(0);
	const refresh = () => setDeep(d => d+1);

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

		const attachEventMetaData = (event) => {
			event.block = blockCache.blocks[event.blockNumber];
			if(event.block) {
				event.timestamp = dayjs.unix(event.block.timestamp)
				event.timeSince = timeSince(event.timestamp);
			}

			if(twitterUsers.state.data[event.counterParty.id]) {
				event.counterParty = twitterUsers.state.data[event.counterParty.id];
			}
			return event;
		}

		const parseEvents = (events) => Promise.all(
			events.map(event => userRegistry.methods.getUser(event.returnValues.claimer).call()
				.then(id => {
					if(!twitterUsers.state.ids.includes(id)) {
						newUserIds.push(id);
					}
					//if(!blockCache.blockNumbers.includes(event.blockNumber)) {
					//}
					blocks.push(event.blockNumber);
					newEvents.push(attachEventMetaData({
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

	}, [bonusEvents, eventList, twitterUsers.state.data, blockCache.blocks]);

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
			refresh();
		}
	}, [blockCache.blockNumbers, blockCache.blocks, eventList])//false, eventList, blockCache, twitterUsers.state.data]);

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
			refresh();
		}
	}, [twitterUsers.state.data, twitterUsers.state.dataLength, eventList]);

return eventList;
}
