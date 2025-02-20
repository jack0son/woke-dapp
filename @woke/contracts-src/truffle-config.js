const secrets = require('@woke/secrets');
var HDWalletProvider = require('@truffle/hdwallet-provider');
const web3 = require('web3');
//var mnemonic = "large fountain love mountains supernatural bird fresh air through the swinging trees";
// prettier-ignore
var devMnemonic = 'nerve marine frozen use brave brief nasty then acid remain stereo riot';
const contractEnv = process.env.ETH_ENV || process.env.NODE_ENV;
secrets('ethereum', contractEnv);
secrets('infura');
mnemonic = process.env.ETH_MNEMONIC;
console.log('mnemonic:', mnemonic);

module.exports = {
	contracts_build_directory: './build/contracts/artifacts',
	networks: {
		'test': {
			host: '127.0.0.1',
			port: 9545,
			network_id: '*',
			websockets: true,

			gas: 8000000,
			gasPrice: 20000000000,
		},

		'development': {
			host: '127.0.0.1',
			port: 8545,
			network_id: '12',
			websockets: true,

			gas: 8000000,
			gasPrice: 20000000000,
		},

		'test2': {
			provider: () => {
				return new web3.providers.WebsocketProvider('ws://127.0.0.1:8545');
			},
			network_id: '10',

			gas: 7000000,
			gasPrice: 20000000000,
		},

		'develop': {
			provider: () => {
				return new HDWalletProvider(devMnemonic, 'http://127.0.0.1:8545/', 0, 10);
			},
			//network_id: "11",
			network_id: '*',
			websockets: true,

			gas: 6000000,
			gasPrice: 20000000000,
		},

		'client': {
			host: '127.0.0.1',
			port: 8545,
			network_id: '12',
			websockets: true,

			gas: 7000000,
			gasPrice: 20000000000,
		},

		'ropsten': {
			provider: () => {
				return new HDWalletProvider(
					mnemonic,
					`https://ropsten.infura.io/v3/${infuraApiKey}`,
					0,
					10
				);
				//return new HDWalletProvider(mnemonic, `wss://ropsten.infura.io/ws/v3/${infuraApiKey}`, 0, 10);
			},
			network_id: '3',
			gas: 8000000,
			gasPrice: 21000000000,
			skipDryRun: true,
		},

		'rinkeby': {
			provider: () => {
				return new HDWalletProvider(
					mnemonic,
					`https://rinkeby.infura.io/v3/${infuraApiKey}`,
					0,
					10
				);
			},
			network_id: '4',
			gas: 6590000,
			gasPrice: 21000000000,
			skipDryRun: true,
		},

		'goerli': {
			provider: () => {
				return new HDWalletProvider(
					mnemonic,
					`https://goerli.infura.io/v3/${infuraApiKey}`,
					0,
					10
				);
			},
			network_id: '5',
			gas: 8000000,
			gasPrice: 20000000000,
			skipDryRun: true,
			defaultCommon: {
				customChain: {
					name: 'goerli',
					networkId: 5,
					chainId: 5,
				},
				baseChain: 'goerli',
			},
		},

		'geth-goerli': {
			provider: () => {
				return new HDWalletProvider(mnemonic, `http://127.0.0.1:8545`, 0, 10);
				//return new HDWalletProvider(mnemonic, `ipc:///root/.ethereum/goerli/geth.ipc`, 0, 10);
			},
			network_id: '5',
			gas: 8000000,
			gasPrice: 20000000000,
			skipDryRun: true,
		},
	},
	compilers: {
		solc: {
			version: '0.5.15',
			//version: '0.6.8',
			optimizer: {
				enabled: true,
				runs: 100,
			},
		},
	},
};
