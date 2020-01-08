// import drizzle functions and contract artifact
import { Drizzle, generateStore } from 'drizzle';
import TwitterOracleMock from '../../contracts/TwitterOracleMock.json';
import WokeToken from '../../contracts/WokeToken.json';
import getProviderEngine from './web3-provider';
import config from '../../config/config';
import Web3 from 'web3';

let network = config.web3.networks[process.env.NODE_ENV];
network = network ? network : {protocol: 'ws', host: 'localhost', port: 8545};

const rpcUrl = `${network.protocol}://${network.host}${network.port ? ':' + network.port : ''}${network.protocol == 'ws' ? '/' + network.protocol : ''}`

console.log(rpcUrl);
// Switch on node env to choose infura
const devProvider = new Web3.providers.WebsocketProvider('ws://localhost:8545');

window.ethereum = null; // Disable metamask

// Web3 is set here https://github.com/trufflesuite/drizzle/blob/develop/src/web3/web3Saga.js

const options = {
  contracts: [WokeToken, TwitterOracleMock],
	events: {
    WokeToken: [
      'Claimed',
			'Lodged',
      'Transfer',
			'Reward',
			'Tx'
    ],
    TwitterOracleMock: [
      'TweetStored',
    ]
  },
  web3: {
		customProvider: devProvider,
    fallback: {
      type: network.protocol,
      url: rpcUrl,
    },
  },

	polls: {
		blocks: 200,
	}
};

export default (provider) => {
	options.web3.customProvider = provider;
	console.dir(options);
	const drizzleStore = generateStore(options);

	console.log('Setting up Drizzle ...')
	return new Drizzle(options, drizzleStore);
}
