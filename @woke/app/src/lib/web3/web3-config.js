import config from '../../config/config';
// Statically configure contract artifacts
//import TwitterOracleMock from '../../contracts/production/TwitterOracleMock.json';
//import WokeToken from '../../contracts/production/WokeToken.json';


const nodeEnv = process.env.NODE_ENV;
const ethNetwork = process.env.REACT_APP_ETH_NETWORK;

const artifactRef = require('../../contracts');
const contractArtifacts = {
	//production: {TwitterOracleMock, WokeToken},
	production: artifactRef,
	development: artifactRef,
}

export function loadContractArtifacts() {
	return contractArtifacts
}

export function getWeb3Network() {
	let networkName = ethNetwork ?  ethNetwork : nodeEnv;
	let network = config.web3.networks[networkName];

	if(!network) {
		console.error(`No configuration found for ethereum network '${networkName}'. Using localhost.`);
		network = {protocol: 'ws', host: 'localhost', port: 8545};
	}

	network.name = networkName;
	return network;
}

export function makeRpcUrl(network) {
	return `${network.protocol}://${network.host}${network.port ? ':' + network.port : ''}${network.protocol == 'ws' ? '/' + network.protocol : ''}`
}

export function getCurrentRpcUrl() {
	return makeRpcUrl(getWeb3Network())
}
