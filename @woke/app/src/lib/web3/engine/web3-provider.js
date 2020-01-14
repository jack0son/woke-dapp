import Web3 from 'web3';
import ZeroClientProvider from './light';
import { getCurrentRpcUrl } from '../web3-config';


export default (wallet) => {
	// Create provider engine
	const rpcUrl = getCurrentRpcUrl();
	const providerEngine = ZeroClientProvider(wallet, {
		// Supports http and websockets
		// but defaults to infura's mainnet rest api
		rpcUrl
	})

	const web3 = new Web3(providerEngine);

	// Log new blocks
	providerEngine.on('block', function(block) {
		const blockNumber = Number.parseInt(block.number.toString('hex'), 16)
		const blockHash = `0x${block.hash.toString('hex')}`
		//console.log(`block: #${blockNumber} ${blockHash}`)
	})

	// Network connectivity error
	providerEngine.on('error', function(err){
		// Report connectivity errors
		console.error(err.stack)
	})

	providerEngine.setMaxListeners(100)
	providerEngine.start()
	
	return providerEngine;
};
