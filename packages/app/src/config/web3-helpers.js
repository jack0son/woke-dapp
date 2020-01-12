import config from './config';
const nodeEnv = process.env.NODE_ENV;
const ethNetwork = process.env.REACT_APP_ETH_NETWORK;

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

//const contractPaths = {
//	'development':
//}

export function loadContractArtifacts(names) {
	////contract
	//if(names) {
	//	names.forEach
	//}
}


export function makeRpcUrl(network) {
	return `${network.protocol}://${network.host}${network.port ? ':' + network.port : ''}${network.protocol == 'ws' ? '/' + network.protocol : ''}`
}

export function getCurrentRpcUrl() {
	return makeRpcUrl(getWeb3Network())
}
