import config from '../../config/config';
// Statically configure contract artifacts
//import TwitterOracleMock from '../../contracts/production/TwitterOracleMock.json';
//import WokeToken from '../../contracts/production/WokeToken.json';
const artifacts = require('../../contracts');
const nodeEnv = process.env.NODE_ENV;
const ethNetwork = process.env.REACT_APP_ETH_NETWORK;

export function loadContractArtifacts() {
	return artifacts;
}

export function getWeb3Network() {
	console.log('env ethNetwork', ethNetwork);
	console.log('env nodeEnv', nodeEnv);
	let networkName = ethNetwork || nodeEnv;
	let network = config.web3.networks[networkName];

	if (!network) {
		console.error(
			`No configuration found for ethereum network '${networkName}'. Using localhost.`
		);
		network = { protocol: 'ws', host: 'localhost', port: 8545 };
	}

	network.name = networkName;
	return network;
}

export function makeRpcUrl(network) {
	return `${network.protocol}://${network.host}${network.port ? ':' + network.port : ''}${
		network.protocol == 'ws' ? '/' + network.protocol : ''
	}`;
}

export function getCurrentRpcUrl() {
	return makeRpcUrl(getWeb3Network());
}
