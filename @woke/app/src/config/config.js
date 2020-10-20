import path from 'path';
const infuraApiKey = process.env.REACT_APP_INFURA_API_KEY;

const root = path.dirname(require.main.filename);

const twitterApi = {
	proxy_api_path: 'twitter_api',
	callback_path: 'oauth_twitter',
};

const host = process.env.REACT_APP_HOST || '192.168.1.167';
const goerli = {
	blockTime: 22000,
	protocol: 'wss',
	host: `goerli.infura.io/ws/v3/${infuraApiKey}`,
	id: 5,
};

export default {
	web3: {
		networks: {
			development: {
				blockTime: 1000,
				protocol: 'ws',
				host: 'localhost',
				//host: `${host}`,
				port: 8545,
				id: 12,
			},

			lan: {
				blockTime: 25000,
				protocol: 'ws',
				host: host, // @TODO LOAD FROM env.local
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

			goerli,

			production: goerli,
			staging: goerli,
		},
	},

	server: {
		development: {
			// URL must have trailing forward slash
			url: 'http://localhost:3001/',
		},

		lan: {
			url: `http://${host}:3001/`,
		},

		staging: {
			url: 'https://api.staging.getwoke.me:8443/',
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

		staging: {
			api: twitterApi,
			hostUrl: 'https://staging-app--getwoke.netlify.app/',
		},

		lan: {
			api: twitterApi,
			hostUrl: `http://${host}:3000/`,
		},

		production: {
			api: twitterApi,
			hostUrl: 'https://getwoke.me/',
		},
	},
};
