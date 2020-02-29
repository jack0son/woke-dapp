require('dotenv').config();
const infuraApiKey = process.env.INFURA_API_KEY;
const ropstenMnemonic = process.env.ROPSTEN_MNEMONIC;
const devMnemonic = 'nerve marine frozen use brave brief nasty then acid remain stereo riot'; // 12 word mnemonic

const GWei = 1000000000;

const rinkeby = {
	id: 4,
	protocol: 'wss',
	host: `rinkeby.infura.io/ws/v3/${infuraApiKey}`,
	gasPrice: 40*GWei,
	gasLimit:  '6590000',
	defaultCommon: {
		customChain: {
			name: 'rin',
			networkId: 4,
			chainId: 4,
		},
		baseChain: 'rinkeby', 
		//hardfork: 'petersburg',
	},
}

const goerli = {
	id: 5,
	protocol: 'wss',
	host: `goerli.infura.io/ws/v3/${infuraApiKey}`,
	gasPrice: 20*GWei,
	gasLimit:  '8000000',
	defaultCommon: {
		customChain: {
			name: 'goerli',
			networkId: 5,
			chainId: 5,
		},
		baseChain: 'goerli', 
		//hardfork: 'petersburg',
	},
}

module.exports = {
	web3: {
		networks: {
			development: {
				id: 12,
				protocol: 'ws',
				host: 'localhost',
				port: 8545,
				gasPrice: '20000000000',
				gasLimit: '6721975',
				defaultCommon: {
					customChain: {
						name: 'ganache',
						networkId: 1,
						chainId: 1,
					},
					baseChain: 'mainnet', 
					hardfork: 'petersburg',
				},
			},

			ropsten: {
				id: 3,
				protocol: 'wss',
				host: `ropsten.infura.io/ws/v3/${infuraApiKey}`,
				gasPrice: 40*GWei,
				gasLimit: '8000000',
			},

			rinkeby,

			goerli,

			production: goerli,
		},
	},

	createRpcUrl
}

function createRpcUrl(network) {
	if(!network) {
		throw new Error('No network provided. Expects: { protocol, host, port }');
	}
	return `${network.protocol}://${network.host}${network.port ? ':' + network.port : ''}`;
}
