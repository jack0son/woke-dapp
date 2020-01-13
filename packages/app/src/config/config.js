import path from 'path'
const infuraApiKey = process.env.REACT_APP_INFURA_API_KEY;

const root = path.dirname(require.main.filename);

export default {
	web3: {
		networks: {
			development: {
				protocol: 'ws',
				host: 'localhost',
				port: 8545,
				id: 12,
			},

			ropsten: {
				protocol: 'wss',
				host: `ropsten.infura.io/ws/v3/${infuraApiKey}`,
				id: 3,
			},

			rinkeby: {
				protocol: 'wss',
				host: `rinkeby.infura.io/ws/v3/${infuraApiKey}`,
				id: 4,
			},

			production: {
				protocol: 'wss',
				host: `rinkeby.infura.io/ws/v3/${infuraApiKey}`,
				id: 4,
			}
		},

		contracts: {
			development: {
				path: 'contracts'
			},
			production: {
				// Relative to app
				path: '../contracts/build/contracts'
			},
		},
	},

	server: {
		development: {
			// URL must have trailing forward slash
			url: 'http://localhost:3001/',
		},

		production: {
			url: 'https://api.getwoke.me:8443/',
		},
	},

	twitter: {
		development: {
			hostUrl: 'http://localhost:3000/',
		},

		production: {
			hostUrl: 'https://getwoke.me/',
		},
	}
}
