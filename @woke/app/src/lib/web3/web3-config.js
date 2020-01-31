import config from '../../config/config';

// Statically configure contract artifacts
import TwitterOracleMock from '../../contracts/production/TwitterOracleMock.json';
import WokeToken from '../../contracts/production/WokeToken.json';


const nodeEnv = process.env.NODE_ENV;
const ethNetwork = process.env.REACT_APP_ETH_NETWORK;

const contractArtifacts = {
	production,
	development: production,//nodeEnv !== 'production' ? require('@woke/contracts') : null
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
