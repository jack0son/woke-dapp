import Web3 from "web3";
import getProviderEngine from './engine/web3-provider';
import { getWeb3Network } from './web3-config.js'


const network = getWeb3Network();

// Instantiate web3 object
export async function makeWeb3(provider) {
	// Check connection
	console.log('Ethereum network: ', network.name);
	const web3 = new Web3(provider);
	await web3.eth.net.isListening();
	let networkId;
	while(networkId != network.id) {
		if(networkId) {
			console.warn(`Expected network ID from config ${network.id}, but got ${networkId}`);
		}
		networkId = await web3.eth.net.getId()
	}

	console.log("Network ID: ", networkId);
	return {web3, network};
}

export function makeWalletProvider(wallet) {
	console.log('Loading wallet provider ...')
	const lightProvider = getProviderEngine(wallet);
	return lightProvider;
}

// Overwrite any existing web3 object
export const injectWeb3 = (_web3 = null) => {
	window.ethereum = null;
	window.web3 = _web3;
}

