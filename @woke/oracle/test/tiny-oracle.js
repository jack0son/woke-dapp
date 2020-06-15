const Web3 = require('web3');
const debug = require('../lib/debug/index');
const assert = require('assert');
const {blog} = require('../lib/debug/common');
const {waitForEventWeb3, genClaimString} = require('../lib/utils');
const waitForEvent = waitForEventWeb3;
const TinyOracle = require('../index');
const twitter = require('../lib/twitter');

const web3 = new Web3('ws://localhost:9545');
const oracleInterface = require('../../build/contracts/TwitterOracleMock.json')
const tokenInterface = require('../../build/contracts/WokeToken.json')

let networkId = 10; // test

//TODO get gas limit and price from web3
const gasPrice = '20000000000';
const gasLimit = '6721975';
const maxSupply = 200000;
const getwoketoke_id = '932596541822419000'; // Ambassador twitter account


// NOTE: 
//	- tests are dependent on the claim string being available on twitter

describe('tiny-oracle', () => {
	let defaultAccount, owner, oraclize_cb, claimer, stranger, rest;
	const MockTwitterOracle = new web3.eth.Contract(oracleInterface.abi)//, {from: owner});
	const WokeToken = new web3.eth.Contract(tokenInterface.abi)//, {from: owner});

	//debug.m('oracleInterface');
	//debug.m(oracleInterface);
	let oracleServer, wt, to, mockTwitter, claimString;

	before(async () => {
		const accounts = await web3.eth.getAccounts();
		[defaultAccount, owner, oraclize_cb, claimer, stranger, ...rest] = accounts;

		to = await MockTwitterOracle.deploy(
			{data: oracleInterface.bytecode, arguments: [oraclize_cb]}
		).send({
			from: owner,
			gas: gasLimit,
			gasPrice: gasPrice,
			value: web3.utils.toWei('0.5', 'ether')
		});
		debug.m(`MockTwitterOracle deployed at ${to.options.address}`);

		wt = await WokeToken.deploy(
			{data: tokenInterface.bytecode, arguments: [to.options.address, maxSupply]}
		).send({
			from: owner,
			gas: gasLimit,
			gasPrice: gasPrice
		});
		debug.m(`WokeToken deployed at ${wt.options.address}`);

		// Pass mock twitter client to oracle
		claimString = await genClaimString(web3, claimer, getwoketoke_id);
		mockTwitter = {
			initClient: async () => true,
			findClaimTweet: () => new Promise((resolve, reject) => {
				setTimeout(() => resolve(claimString), 1000)
			})
		}

		debug.m('mocktwitter', await mockTwitter.findClaimTweet());

		oracleServer = new TinyOracle(web3, oracleInterface, to.options.address, networkId, {twitter: mockTwitter});
		await oracleServer.start(oraclize_cb);
		debug.t('Started tiny-oracle.');
	})

	after(async () => {
		// Clean up tiny-oracle
		await oracleServer.stop();
	})


	it('should store query result in TwitterOracle mock', async () => {
		// Lodge claim
		let opts = {from: claimer, gas: gasLimit, gasPrice: gasPrice};
		debug.t('Lodging claim from ', claimer);
		let r = await wt.methods.claimUser(getwoketoke_id, 'getwoketoke').send(opts);
		let bn = r.blockNumber;
		let queryId = r.events['Lodged'].returnValues.queryId;
		debug.t('queryId: ', queryId);

		//debug.t('Waiting for oracle response...');
		const {returnValues: tweetStored} = await waitForEvent(to, 'TweetStored');
		debug.t('tweetStored: ', tweetStored);
	})

	it('trigger fulfill request by WokeToken', async () => {
		let opts = {from: claimer, gas: gasLimit, gasPrice: gasPrice};
		let r = await wt.methods._fulfillClaim(getwoketoke_id).send(opts);
		// TODO verify claimed event is correct
	})

	describe('claim string', () => {
		it('should match tweet', async () => {
			await twitter.initClient();
			let tweet = await twitter.findClaimTweet('getwoketoke');
			debug.m('Claim string: ', claimString);
			debug.m('Tweet: ', tweet);
			assert.strictEqual(tweet, claimString);
		})

		it('should verify claim string from twitter', async () => {
			//let result = await wt.verifyClaimString.call(claimer, getwoketoke_id, claimString);
			//assert.isTrue(result);
		})
	})

})

