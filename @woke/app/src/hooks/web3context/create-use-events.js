import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWeb3Context } from '.';
import { useIsMounted } from '../util-hooks';

// Need to use this utility in place of web3.eth.Contract.getPastEvents due to
// version synchonisation issue between web3-provider-engine and web3
//import { makeLogEventSubscription } from '../../lib/web3/web3-utils';
// @dev createUseEvents
// @dev Hook generator for web3 provider context
export default web3 => (contractName, eventName, opts) => {
	// TODO remove events (if tx is unconfirmed)
	const {useContract} = useWeb3Context();
	const contract = useContract(contractName);
	const [events, setEvents] = useState([]);

	const isMounted = useIsMounted() // ref

	useEffect(() => {
		let emitter;
		let mounted = true;

		const safeSetEvents = (setFunc) => {
			if(mounted) {
				setEvents(events => setFunc(events));
			}
		}

		function setupEmitter() {
			let pastOpts = {
				...opts,
				fromBlock: 0,
				toBlock: 'latest',
			};

			contract.getPastEvents(eventName, pastOpts, function(error, events) {
				if(error) {
					console.error(error, {contract, eventName, pastOpts});
				}
			}).then(pastEvents => safeSetEvents(events => [...events, ...pastEvents]));

			let latestOpts = {
				...opts,
				fromBlock: 'latest',
			}

			emitter = contract.events[eventName](latestOpts, (error, event) => {
				if (error) {
					console.error(`Subscription error ${contractName}.events.${eventName}:\n${error}`);
					return;
				}
				safeSetEvents(events => [...events, event])
			})
		}

		if(contract && contractName && eventName) {
			setupEmitter();
		}

		// TODO use web3.eth.subscribe to manage subscription
		// TODO emitter needs to be stored in state to cleanup
		return (() => {
			mounted =  false;
			if(emitter && emitter.unsubscribe) {
				//console.log(emitter);
				emitter.unsubscribe();
			}
		})
	}, [contract, contractName, eventName, opts]);

	return events;
}
