
import React, { useState, useEffect, useMemo, useRef, useCallback} from 'react';
import { useWeb3Context } from '../web3context'
import { useTwitterContext } from '../twitter/index.js'

import dayjs from 'dayjs';
import { timeSince } from '../../lib/utils';

// useEventMetaData
export default function(blockCache, eventList, setEventList) {
	const twitterUsers = useTwitterContext().userList;

	// @fix work around for use effect not deepcomparing the event list items
	const [deep, setDeep] = useState(0);
	const refresh = () => setDeep(d => d+1);

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

	return {
		attach: attachEventMetaData,
		refresh, 
		updates: deep,
	}
}
