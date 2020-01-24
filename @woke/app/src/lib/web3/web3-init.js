import Web3 from "web3";
import getProviderEngine from './engine/web3-provider';
import { getWeb3Network, getCurrentRpcUrl} from './web3-config.js'


const network = getWeb3Network();

// Instantiate web3 object
export async function makeWeb3({wallet}) {
	// Check connection
	console.log('Ethereum network: ', network.name);
	console.log(wallet);
	//const web3 = new Web3(provider);
	const web3 = new Web3(getCurrentRpcUrl());
	addAccountFromWallet(web3, wallet);

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

function addAccountFromWallet(web3, wallet) {
	console.log('Adding account: ', wallet.getAddressString());
	const account = web3.eth.accounts.wallet.add(wallet.getPrivateKeyString());
	web3.eth.defaultAccount = account.address;
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

