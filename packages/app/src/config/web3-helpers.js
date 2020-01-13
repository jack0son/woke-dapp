import config from './config';
import path from 'path';
import fs from 'fs';
import TwitterOracleMock from '../contracts/TwitterOracleMock.json';
import WokeToken from '../contracts/WokeToken.json';

const nodeEnv = process.env.NODE_ENV;
const ethNetwork = process.env.REACT_APP_ETH_NETWORK;
const productionArtifacts = {
	WokeToken,
	TwitterOracleMock,
}
const contractNames = Object.keys(productionArtifacts);

// @dev Need to use conditional import for contract artifacts
export function loadContractArtifacts() {
	return new Promise((resolve, reject) => {
		let artifacts = {};
		import('../../../contracts/build/contracts/WokeToken.json').then(console.dir)
		if(nodeEnv !== 'production') {
			const contractsPath = path.resolve(__dirname, config.web3.contracts[nodeEnv].path);
			console.log(contractsPath);
			contractNames.forEach(name => {
				import(path.resolve(contractsPath, `${name}.json`)).then(artifact => {
					artifacts[name] = artifact;
				});
			})
		} else {
			artifacts = productionArtifacts;
		}

		resolve(artifacts);
	});
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
