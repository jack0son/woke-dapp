import React, { useState, useEffect, useMemo } from 'react'
import { useWeb3Context } from '.';
import {subscribeLogContract} from '../../lib/web3/web3-utils'

// @dev createUseContractSubscriptions
// @dev Maintain a single subscription with a list of callbacks for each
// contract
export default web3 => {
	const [state, setState] = useState({
		subs: {},
		contractNames: [],
	});

	// Returns: unsubscribe
	const subscribe = (contract, contractName, callOnUpdate) => {
		// If no subscription to this contract exists, create one
		let subscriberIndex = 0;
		if(!state.contractNames.includes(contractName)) {
			const sub = {
				subscribers: [{active: true, callback: callOnUpdate}], // Callbacks to run on every subscription update
				subObj: null,
			}

			// Create the web3 subscription
			const subObj = subscribeLogContract(web3)(contract, (logData) => {
				sub.subscribers.filter(subscriber => subscriber.active)
					.forEach(subscriber => subscriber.callback())
			});
			sub.subObj = subObj;
			sub.subObj.start();

			// Store subscription in hook state
			setState(state => {
				state.contractNames = [...state.contractNames, contractName];
				state.subs[contractName] = sub;
				return state;
			});
		} else {
			// Add the callback to the existing contract subscription
			subscriberIndex = state.subs[contractName].subscribers.length;
			setState(state => {
				state.subs[contractName].subscribers.push({active: true, callback: callOnUpdate});
				//console.log(`${contractName} subscriptions: ${state.subs[contractName].subscribers.length}`);
				return state;
			})
		}

		const update = (callback) => {
			setState(state => {
				const sub = state.subs[contractName];
				sub.subscribers[subscriberIndex].callback = callback;

				return state;
			})
		}

		// Stop subscription
		const stop = () => {
			setState(state => {
				state.subs[contractName].subscribers[subscriberIndex].active = false;
				return state; 
			});
		}

		console.log('subscriber index ', subscriberIndex);

		return {
			update,
			stop
		}
	}

	// Clean up subscriptions
	// TODO manage when this cleanup occurs
	useEffect(() => {
		const unsubscribe = () => Promise.all(state.contractNames.map(
			contractName => state.subs[contractName].subObj.stop()
		));

		return unsubscribe;
	}, []);

	return subscribe;
}
