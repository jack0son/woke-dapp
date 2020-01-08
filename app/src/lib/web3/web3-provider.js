import ZeroClientProvider from './engine/light';
import config from '../../config/config';
import Web3 from 'web3';

const nodeEnv = process.env.NODE_ENV;
let networkName = nodeEnv != 'development' ? nodeEnv : process.env.REACT_APP_ETH_NETWORK;
console.log('Ethereum network: ', networkName);
let network = config.web3.networks[networkName];
network = network ? network : {protocol: 'ws', host: 'localhost', port: 8545};

const rpcUrl = `${network.protocol}://${network.host}${network.port ? ':' + network.port : ''}${network.protocol == 'ws' ? '/' + network.protocol : ''}`

export default (wallet) => {
	// create engine
	const providerEngine = ZeroClientProvider(wallet, {
		// supports http and websockets
		// but defaults to infura's mainnet rest api
		rpcUrl
	})

	// use the provider to instantiate Ethjs, Web3, etc
	const web3 = new Web3(providerEngine);

	// log new blocks
	providerEngine.on('block', function(block) {
		const blockNumber = Number.parseInt(block.number.toString('hex'), 16)
		const blockHash = `0x${block.hash.toString('hex')}`
		//console.log(`block: #${blockNumber} ${blockHash}`)
	})

	// network connectivity error
	providerEngine.on('error', function(err){
		// report connectivity errors
		console.error(err.stack)
	})

	providerEngine.setMaxListeners(100)
	providerEngine.start()
	
	return providerEngine;
};
