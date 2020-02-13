const Web3 = require('web3');
const config = require('./web3-config');
const network = config.web3.networks[process.env.ETH_ENV || process.env.NODE_ENV || 'development'];

//const devPrivKey = '0x1aa8fa0e6762d47569b2aeb1fc53ee64ac0bc9d8070967f1c4970a35bc84ca7a';
const devPrivKey = '0xe57d058bb90483a0ebf0ff0107a60d9250a0b9b5ab8c53d47217c9958025cce7';
const ropstenPrivKey = process.env.ROPSTEN_PRIV_KEY;

let privKey;
switch(process.env.ETH_ENV) {
	case 'development': {
		privKey = devPrivKey;
		break;
	}

		// TODO add mainnet
	case 'production': {
	}

	default: {
		privKey = ropstenPrivKey;
		break;
	}
}

module.exports = () => {
	const rpcUrl = config.createRpcUrl(network);
	const web3 = new Web3(rpcUrl);

	let wallet = null;
	if(!privKey) {
		console.log('WARNING: web3 has no local unlocked account');
	} else {
		let wallet = web3.eth.accounts.wallet.add(privKey);
		web3.eth.defaultAccount = wallet.address;
		web3.eth.defaultCommon = network.defaultCommon;
	}

	return {
		web3,
		network,
		account: wallet ? wallet.address : null,
	}
}
