import getProviderEngine from './web3-provider';
import Web3 from "web3";

const injectWeb3 = async (wallet) => {
	console.log('Loading wallet provider ...')
	const zeroProvider = getProviderEngine(wallet);
	//const web3 = new Web3(zeroProvider);

	// Check connection
	//const web3 = new Web3(zeroProvider);
	//const networkId = await web3.eth.net.getId()
	window.ethereum = null;
	window.web3  = null;
	return zeroProvider;
}

export default injectWeb3;
