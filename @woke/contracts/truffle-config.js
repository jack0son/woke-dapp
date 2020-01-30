var HDWalletProvider = require("truffle-hdwallet-provider");
require('dotenv').config();
//var mnemonic = "large fountain love mountains supernatural bird fresh air through the swinging trees";
var mnemonic = "nerve marine frozen use brave brief nasty then acid remain stereo riot";
var ropstenMnemonic = process.env.ROPSTEN_MNEMONIC;
var infuraApiKey = process.env.INFURA_API_KEY;
const contractEnv = process.env.CONTRACT_ENV;

module.exports = {
	contracts_build_directory: contractEnv ? `./artifacts/${contractEnv}` : undefined,
  networks: {
    test: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*",
			websockets: true
    },

    develop: {
			provider: () => {
				return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 10);
      },
      network_id: "11",
			websockets: true
		},

		client: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "12",
			websockets: true
		},

		ropsten: {
			provider:() => {
				return new HDWalletProvider(ropstenMnemonic, `https://ropsten.infura.io/v3/${infuraApiKey}`, 0, 10);
				//return new HDWalletProvider(ropstenMnemonic, `wss://ropsten.infura.io/ws/v3/${infuraApiKey}`, 0, 10);
      },
      network_id: "3",
			gas: 8000000,
			gasPrice: 21000000000,
			skipDryRun: true,
		},

		rinkeby: {
			provider:() => {
				return new HDWalletProvider(ropstenMnemonic, `https://rinkeby.infura.io/v3/${infuraApiKey}`, 0, 10);
      },
      network_id: "4",
			gas: 6590000,
			gasPrice: 21000000000,
			skipDryRun: true,
		}
  },
	//compilers: {
	//	solc: {
	//		version: '0.5.6'
	//	}
	//}
}
