import React, {useState, useEffect, useMemo} from 'react';
import Web3 from 'web3';
import {getContract} from '../lib/web3/web3-utils'
import config from '../config/config';

import TwitterOracleMock from '../contracts/TwitterOracleMock.json';
import WokeToken from '../contracts/WokeToken.json';

let network = config.web3.networks[process.env.NODE_ENV];
const networkId = network.id;

// Move this to initialization
const devProvider = new Web3.providers.WebsocketProvider('ws://localhost:8545');
// Switch on node env to choose infura
const provider = devProvider;
const myWeb3 = new Web3(provider);
const web3 = myWeb3;

console.dir(myWeb3);

const artifacts = {
	TwitterOracleMock: TwitterOracleMock,
	WokeToken: WokeToken
}

const createUseWeb3Events = (drizzleWeb3) => {
	/*
	web3 = useMemo(() => {
		// Web3 1.2
		//const networkId = web3.net.getId();
		//web3.currentProvider.networkVersion;
		return web3;

	}, [web3.currentProvider]);

	*/
	// Bind useWeb3Events to web3 instance
	return (contractName, eventName, opts) => useWeb3Events(web3, contractName, eventName, opts);
}

const useContract = (contractName) => useMemo(() =>
	//getContract(web3, artifacts[contractName], web3.currentProvider.networkVersion)
	getContract(web3, artifacts[contractName], networkId)
, [contractName])

export const getPastEvents = (contractName, eventName, opts) => {
	//console.dir(artifacts);
	const contract = getContract(web3, artifacts[contractName], networkId);

	return contract.getPastEvents(eventName, {...opts, fromBlock: 0}); 
}

export const getContractCall = (contractName, methodName, ...args) => {
	const contract = getContract(web3, artifacts[contractName], networkId);

	return contract.methods[methodName](...args);
}

export const useWeb3= () => {
	return web3;
}

const useWeb3Events = (contractName, eventName, opts) => {
	// TODO useGetPast events on initial call
	// TODO remove events (if tx is unconfirmed)
	opts = opts || {
		fromBlock: 'latest',
	}
	// 1. Get past events
	
	const contract = useContract(contractName);

	const [events, setEvents] = useState([]);
	const [errors, setErrors] = useState([]);

	useEffect(() => {
		const emitter = contract.events[eventName](opts, (error, event) => {
			if (error) {
				console.error(`Subscription error ${contractName}.events.${eventName}:\n${error}`);
				return;
			}

			setEvents(events => [...events, event])
		})
		
		return (() => {
			if(emitter && emitter.unsubscribe) {
				//emitter.unsubcribe();
			}
		})
	}, [contractName, eventName, opts]);

	return events;
}

export default useWeb3Events;
