const Web3 = require('web3');
const config = require('./web3-config');
const defaultNetwork =
	config.web3.networks[process.env.ETH_ENV || process.env.NODE_ENV || 'development'];

const privKeys = {
	oracle: '0xd90e07ec113aae69c3b018bef0b85ba44595294b43e55468807e6ef8399e1f54',
	tipper: '0xd2fb22cae69613116e7a29258f38b375974c4e77bb68a1776ec4af7c54bad633',
};

const devPrivKeys = {
	oracle: '0xe57d058bb90483a0ebf0ff0107a60d9250a0b9b5ab8c53d47217c9958025cce7',
	tipper: '0x5af83b503129f5c2c32edb23ae02564762783ab1065d23fde5a6d6158762322c',
	funder: '0x0e092bf19c998635863ec90257ae3e26da129fb18f31185d1d1199c7f35f0a1e',
};

const funderPrivKey = privKeys.oracle;

//const devPrivKey = '0x1aa8fa0e6762d47569b2aeb1fc53ee64ac0bc9d8070967f1c4970a35bc84ca7a';
const devPrivKey = '0xe57d058bb90483a0ebf0ff0107a60d9250a0b9b5ab8c53d47217c9958025cce7'; // index 2
//const tipperPrivkey = process.env.TIPPER_PRIV_KEY || '5af83b503129f5c2c32edb23ae02564762783ab1065d23fde5a6d6158762322c'; // index 1
const ropstenPrivKey = process.env.ROPSTEN_PRIV_KEY;

const ETH_ENV = process.env.ETH_ENV || 'development';

function selectPrivKey() {
	switch (process.env.ETH_ENV) {
		case 'production':
		default:
			switch (process.env.WOKE_ROLE) {
				case 'funder':
					return funderPrivKey;
				case 'notifier':
				case 'tipper':
					return privKeys.tipper;
				case 'oracle':
					return privKeys.oracle;
				default:
					return devPrivKey;
			}
		case 'development':
			switch (process.env.WOKE_ROLE) {
				case 'funder':
					return devPrivKeys.funder;
				case 'notifier':
				case 'tipper':
					return devPrivKeys.tipper;
				case 'oracle':
					return devPrivKeys.oracle;
				default:
					return devPrivKey;
			}
	}
}

let privKey = selectPrivKey();

function instantiate(networkName, opts) {
	const defaults = {
		handleRevert: true,
	};
	const { handleRevert } = { ...defaults, ...opts };

	const network = (!!networkName && config.web3.networks[networkName]) || defaultNetwork;

	const rpcUrl = config.createRpcUrl(network);
	const web3 = new Web3(rpcUrl);
	web3.eth.handleRevert = handleRevert;

	let wallet = null;
	if (!privKey) {
		console.log('WARNING: web3 has no local unlocked account');
		// If using ganache, unlock the accounts
	} else {
		wallet = web3.eth.accounts.wallet.add(privKey);
		web3.eth.defaultAccount = wallet.address;
		web3.eth.defaultCommon = network.defaultCommon;
	}

	// Web3Instance
	return {
		web3,
		network,
		account: wallet ? wallet.address : null,
		rpcUrl,
		//accounts: web3.eth.accounts,
	};
}

module.exports = { instantiate, network: defaultNetwork };
