import Web3 from "web3";
import { getWeb3Network, getCurrentRpcUrl } from './web3-config.js'
import { checkConnection } from './web3-utils.js'


const network = getWeb3Network();

// Instantiate web3 object
export async function makeWeb3({wallet}) {
	console.log('Ethereum network: ', network.name);
	const web3 = new Web3(getCurrentRpcUrl());

	// Add wallet to in-memory wallet
	let account = {address: null}
	if(wallet) {
		account = web3.eth.accounts.wallet.add(wallet.getPrivateKeyString());
		web3.eth.defaultAccount = account.address;
	}
	console.log(`Web3 initialised with ${wallet ? account.address : 'no account'}`);


	// Check connection
	let networkId;
	while(networkId !== network.id) {
		if(networkId) {
			console.warn(`Expected network ID from config ${network.id}, but got ${networkId}`);
		}
		console.log('Checking web3 connection...');
		networkId = await checkConnection(web3, 8000);
	}

	console.log("Network ID: ", networkId);
	return {web3, network, account: account.address};
}

export function makeWalletProvider(wallet) {
	console.log('Loading wallet provider ...')
	const lightProvider = null //getProviderEngine(wallet);
	return lightProvider;
}

// Overwrite any existing web3 object
export const injectWeb3 = (_web3 = null) => {
	window.ethereum = null;
	window.web3 = _web3;
}
