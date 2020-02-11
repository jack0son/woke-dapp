import path from 'path'
const infuraApiKey = process.env.REACT_APP_INFURA_API_KEY;

const root = path.dirname(require.main.filename);

const twitterApi = {
	proxy_api_path: 'twitter_api',
	callback_path: 'oauth_twitter',
}

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

			goerli: {
				protocol: 'wss',
				host: `goerli.infura.io/ws/v3/${infuraApiKey}`,
				id: 4,
			},

			production: {
				protocol: 'wss',
				host: `rinkeby.infura.io/ws/v3/${infuraApiKey}`,
				id: 4,
			}
		}
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
			api: twitterApi,
			hostUrl: 'http://localhost:3000/',
		},

		production: {
			api: twitterApi,
			hostUrl: 'https://getwoke.me/',
		},
	}
}
