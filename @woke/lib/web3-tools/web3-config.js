require('dotenv').config();
const infuraApiKey = process.env.INFURA_API_KEY;
const ropstenMnemonic = process.env.ROPSTEN_MNEMONIC;
const devMnemonic =
	'nerve marine frozen use brave brief nasty then acid remain stereo riot'; // 12 word mnemonic

const GWei = 1000000000;

const rinkeby = {
	id: 4,
	protocol: 'wss',
	host: `rinkeby.infura.io/ws/v3/${infuraApiKey}`,
	gasPrice: 40 * GWei,
	gasLimit: '6590000',
	blockTime: 20000,
	defaultCommon: {
		customChain: {
			name: 'rin',
			networkId: 4,
			chainId: 4,
		},
		baseChain: 'rinkeby',
		//hardfork: 'petersburg',
	},
};

// GCloud conf
const goerli_infura = {
	id: 5,
	protocol: 'wss',
	host: `goerli.infura.io/ws/v3/${infuraApiKey}`,
	gasPrice: 20 * GWei,
	gasLimit: '8000000',
	blockTime: 15000,
	defaultCommon: {
		customChain: {
			name: 'goerli',
			networkId: 5,
			chainId: 5,
		},
		baseChain: 'goerli',
		//hardfork: 'petersburg',
	},
};

const goerli_1 = {
	id: 5,
	protocol: 'ws',
	host: `geth-goerli-1.us-west2-a.c.woke-network-services.internal`,
	port: 8546,
	gasPrice: 20 * GWei,
	gasLimit: '8000000',
	blockTime: 15000,
	defaultCommon: {
		customChain: {
			name: 'goerli',
			networkId: 5,
			chainId: 5,
		},
		baseChain: 'goerli',
		//hardfork: 'petersburg',
	},
};

const goerli_2 = {
	id: 5,
	protocol: 'ws',
	host: `geth-goerli-2.us-west2-a.c.woke-network-services.internal`,
	port: 8546,
	gasPrice: 20 * GWei,
	blockTime: 15000,
	gasLimit: '8000000',
	defaultCommon: {
		customChain: {
			name: 'goerli',
			networkId: 5,
			chainId: 5,
		},
		baseChain: 'goerli',
		//hardfork: 'petersburg',
	},
};

const goerli_3 = {
	id: 5,
	protocol: 'ws',
	host: `geth-goerli-3.us-west2-b.c.woke-network-services.internal`,
	port: 8546,
	gasPrice: 20 * GWei,
	blockTime: 15000,
	gasLimit: '8000000',
	defaultCommon: {
		customChain: {
			name: 'goerli',
			networkId: 5,
			chainId: 5,
		},
		baseChain: 'goerli',
		//hardfork: 'petersburg',
	},
};

const goerli = goerli_2;

module.exports = {
	web3: {
		networks: {
			development: {
				id: 12,
				protocol: 'ws',
				host: 'localhost',
				port: 8545,
				gasPrice: '20000000000',
				blockTime: 3000,
				gasLimit: '8000000',
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
				gasPrice: 40 * GWei,
				blockTime: 20000,
				gasLimit: '8000000',
			},

			rinkeby,

			goerli_infura,

			goerli,
			goerli_1,
			goerli_2,
			goerli_3,

			production: goerli,
		},
	},

	createRpcUrl,
};

const invalidRpcUrl = (url) => url.includes('undefined');

function createRpcUrl(network) {
	if (!network) throw new Error('No network provided. Expects: { protocol, host, port }');

	const rpcUrl = `${network.protocol}://${network.host}${
		network.port ? ':' + network.port : ''
	}`;

	if (invalidRpcUrl(rpcUrl)) throw new Error(`Invalid web3 provider RPC URL ${rpcUrl}`);
	return rpcUrl;
}
