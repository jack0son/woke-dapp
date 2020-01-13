import config from './config';
import path from 'path';
import fs from 'fs';
import TwitterOracleMock from '../contracts/TwitterOracleMock.json';
import WokeToken from '../contracts/WokeToken.json';


const nodeEnv = process.env.NODE_ENV;
const ethNetwork = process.env.REACT_APP_ETH_NETWORK;

const contractArtifacts = {
	production: {
		WokeToken,
		TwitterOracleMock,
	},
	development: null
}

if(nodeEnv === 'development') {
	contractArtifacts.development = require('../contracts')
}

export function loadContractArtifacts() {
	let artifacts;

	if(nodeEnv !== 'production') {
		if(contractArtifacts.development === null) {
			throw new Error('Could not locate development artifacts');
			return;
		}

		artifacts = contractArtifacts.development;
	} else {
		artifacts = contractArtifacts.production;
	}

	return artifacts;
}

export function getWeb3Network() {
	let networkName = nodeEnv == 'development' ?  ethNetwork : nodeEnv;
	console.log('Ethereum network: ', networkName);
	let network = config.web3.networks[networkName];

	if(!network) {
		console.error(`No configuration found for ethereum network '${networkName}'. Using localhost.`);
		network = {protocol: 'ws', host: 'localhost', port: 8545};
	}

	return network;
}

export function makeRpcUrl(network) {
	return `${network.protocol}://${network.host}${network.port ? ':' + network.port : ''}${network.protocol == 'ws' ? '/' + network.protocol : ''}`
}

export function getCurrentRpcUrl() {
	return makeRpcUrl(getWeb3Network())
}
