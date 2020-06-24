const assert = require('assert');
const expect = require('chai').use(require('chai-as-promised')).expect

const { web3Tools } = require('@woke/lib');
const { ActorSystem } = require('@woke/wact');
const { query, dispatch, bootstrap } = ActorSystem;
const { delay } = require('../src/lib/utils');
const { Web3 } = require('../src');
const TxSystem = require('../src/systems/tx');
const Web3Actor = Web3;

const TIME_OKAY = 10;
const TIME_LONG = 100;
const TIME_TIMEOUT = 500;

const developmentNetwork = {
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
}

const networks = {
	development: developmentNetwork,
	fallback_1: {
		...developmentNetwork,
		host: 'fallback_host_1',
	},
	fallback_2: {
		...developmentNetwork,
		host: 'fallback_host_2',
	}
}
const NETWORK_ID = networks.development.id;

const getId_long = async () => {
		await delay(TIME_LONG);
		return NETWORK_ID;
}

const getId_okay = async () => {
		await delay(TIME_OKAY);
		return NETWORK_ID;
}

const getId_wrong = async () => {
		await delay(TIME_OKAY);
		return NETWORK_ID + 1;
}

const getId_fail = async () => {
		await delay(TIME_OKAY)
		throw new Error('Connect not open on send()');
}

// Fail n times then succeed
const getId_fail_n = (n) => {
	let count = 0;
	return async () => {
		count = count + 1;
		if(count == 2) {
			return getId_wrong();
		}
		if(count < n) {
			return getId_fail()
		}

		return getId_okay();
	}
}

const getId_timeout = async () => {
		await delay(TIME_TIMEOUT);
		throw new Error('Connection timed out');
}

const init_web3_redundant = networks => networkName => !!networkName && networks[networkName] ?
		networks[networkName]
		: networks.development;

const networksFailure = {
		development: Web3Mock(getId_fail, networks.development),
		fallback_1: Web3Mock(getId_fail, networks.fallback_1),
		fallback_2: Web3Mock(getId_fail, networks.fallback_2),
}

const networksSuccess = {
		development: Web3Mock(getId_fail, networks.development),
		fallback_1: Web3Mock(getId_fail, networks.fallback_1),
		fallback_2: Web3Mock(getId_fail_n(2), networks.fallback_2),
};

function Web3Mock(getId, network) {
	const web3 = {
		eth: {
			net: {
				getId,
			}
		}
	}

	const account = '0x0000000000000000000000000000000000000000';
	network = network || networks.development;
	const rpcUrl = web3Tools.config.createRpcUrl(network);

	return { web3, account, network: networks.development, rpcUrl };
}


// The focus of these tests is the flow communication flow within the web3 actor
// -- not the web3 tools
context('Web3Actor', function() {
	let director, a_web3, a_txSystem;

	//const web3Instance_example = Web3Mock(getId_okay)

	beforeEach(function () {
		director = bootstrap();
		a_txSystem = TxSystem(director);
	})

	describe('#send', function() {
		it('should send a transaction', async function() {

			const res = await query(a_txSystem, { type: 'send', opts: {} }, TIME_TIMEOUT);
			console.log(res);
			// Pass web3 mock instantiator as web3_init function
			//a_web3 = director.start_actor('web3', Web3Actor(() => Web3Mock(getId_okay)));
			//await query(a_web3, { type: 'init' }, TIME_TIMEOUT)
			//const { web3Instance } =  await query(a_web3, { type: 'get' }, TIME_TIMEOUT);

			////jhreturn expect(web3Instance).to.have.property('account');
		})

	})
})
