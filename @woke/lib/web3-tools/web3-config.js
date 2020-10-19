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

const internalGethHost = (idx) => `geth-goerli-${idx}-internal`;

const goerli_1 = {
	name: 'goerli_1',
	id: 5,
	protocol: 'ws',
	host: internalGethHost(1),
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

const goerli_2 = { ...goerli_1, name: 'goerli_2', host: internalGethHost(2) };
const goerli_3 = { ...goerli_1, name: 'goerli_3', host: internalGethHost(3) };

const goerli = goerli_1;

const web3Config = {
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
		staging: goerli,
	},
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

module.exports = {
	web3: web3Config,
	createRpcUrl,
};
