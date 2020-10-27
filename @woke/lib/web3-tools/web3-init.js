const Web3 = require('web3');
const secrets = require('@woke/secrets');
const config = require('./web3-config');
const configure = require('../configure');
const instanceMethods = require('./instance-methods');
const defaultNetwork =
	config.web3.networks[process.env.ETH_ENV || process.env.NODE_ENV || 'development'];

const devPrivKeys = {
	staging: {
		funder: '0xd90e07ec113aae69c3b018bef0b85ba44595294b43e55468807e6ef8399e1f54',
		oracle: '0xd90e07ec113aae69c3b018bef0b85ba44595294b43e55468807e6ef8399e1f54',
		tipper: '0xd2fb22cae69613116e7a29258f38b375974c4e77bb68a1776ec4af7c54bad633',
		notifier: '0xd2fb22cae69613116e7a29258f38b375974c4e77bb68a1776ec4af7c54bad633',
	},
	local: {
		oracle: '0xe57d058bb90483a0ebf0ff0107a60d9250a0b9b5ab8c53d47217c9958025cce7',
		tipper: '0x5af83b503129f5c2c32edb23ae02564762783ab1065d23fde5a6d6158762322c',
		funder: '0x0e092bf19c998635863ec90257ae3e26da129fb18f31185d1d1199c7f35f0a1e',
	},
};

//const devPrivKey = '0x1aa8fa0e6762d47569b2aeb1fc53ee64ac0bc9d8070967f1c4970a35bc84ca7a';
const devPrivKey = '0xe57d058bb90483a0ebf0ff0107a60d9250a0b9b5ab8c53d47217c9958025cce7'; // index 2
//const tipperPrivkey = process.env.TIPPER_PRIV_KEY || '5af83b503129f5c2c32edb23ae02564762783ab1065d23fde5a6d6158762322c'; // index 1

const ETH_ENV = process.env.ETH_ENV || 'development';
const ENV_PRIV_KEY = process.env.ETH_KEY;

const keyPostfix = process.env.WOKE_ROLE || 'DEFAULT';

function selectPrivKey() {
	if (ENV_PRIV_KEY) return ENV_PRIV_KEY;

	switch (process.env.ETH_ENV) {
		case 'production':
			// @TODO should just be loaded as ETH_KEY, but secrets package needs to
			// load env vars before web3-tools is important.
			const key = process.env[`PRIV_KEY_${keyPostfix.toUpperCase()}`];
			if (!key) throw new Error('Production priv keys not configured');
			console.log({ key });
			return key;

		case 'staging':
		default:
			return devPrivKeys.staging[process.env.WOKE_ROLE] || devPrivKey;

		case 'development':
			switch (process.env.WOKE_ROLE) {
				case 'funder':
					return devPrivKeys.local.funder;
				case 'notifier':
				case 'tipper':
					return devPrivKeys.local.tipper;
				case 'oracle':
					return devPrivKeys.local.oracle;
				default:
					return devPrivKey;
			}
	}
}

let privKey = selectPrivKey();

const defaults = {
	handleRevert: true,
	attachInstanceMethods: true,
};

function instantiate(networkName, opts) {
	const conf = configure(opts, defaults);

	const networks = config.getNetworks();
	const network = (!!networkName && networks[networkName]) || defaultNetwork;
	if (networkName) network.name = networkName;

	const rpcUrl = config.createRpcUrl(network);
	const web3 = new Web3(rpcUrl, { transactionConfirmationBlocks: 1 });
	web3.eth.handleRevert = conf.handleRevert;

	let wallet = null;
	console.log(privKey);
	if (!privKey) {
		console.log('WARNING: web3 has no local unlocked account');
		// If using ganache, unlock the accounts
	} else {
		wallet = web3.eth.accounts.wallet.add(privKey);
		web3.eth.defaultAccount = wallet.address;
		web3.eth.defaultCommon = network.defaultCommon;
	}

	const web3Instance = {
		web3,
		network,
		account: wallet ? wallet.address : null,
		rpcUrl,
		//accounts: web3.eth.accounts,
	};

	const methods = conf.instanceMethods
		? Object.keys(methods).reduce((m, key) => {
				m[key] = methods[key](web3Instance);
				return m;
		  }, {})
		: {};

	Object.assign(web3Instance, methods);
	return web3Instance;
}

module.exports = { instantiate, network: defaultNetwork };
