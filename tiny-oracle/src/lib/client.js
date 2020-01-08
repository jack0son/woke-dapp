// Client assumes that the Token is migrated and (paired with the mock oracle?)

const Web3 = require('web3');
const debug = require('../lib/debug/index');
const assert = require('assert');
const {blog} = require('../lib/debug/common');
const {waitForEventWeb3, genClaimString} = require('../lib/utils');
const waitForEvent = waitForEventWeb3;
const TinyOracle = require('../index');
const twitter = require('../lib/twitter');

const web3 = new Web3('ws://localhost:8545');
const oracleInterface = require('../../build/contracts/TwitterOracleMock.json')
const tokenInterface = require('../../build/contracts/WokeToken.json')

let networkId = 12; // client

//TODO get gas limit and price from web3
const gasPrice = '20000000000';
const gasLimit = '6721975';
const maxSupply = 200000;
const getwoketoke_id = '932596541822419000'; // Ambassador twitter account

// To do
//  1. configure develop network with mnemonic
//  2. write test instructions - migrate then run this client
//  3. restructure this client as a mocha test suite

//const to_address = '0xbC03f13C2140225C3F5E0cC92b9B0824C5E3AE60';
//const wt_address = '0x7745EC95977F6EB2f8E690c39b8965243fE167DB';

let to_address, wt_address;

const initClient = async (simulate) => {
	if(oracleInterface.networks[networkId].address) {
		to_address = oracleInterface.networks[networkId].address
	}
	if(tokenInterface.networks[networkId].address) {
		wt_address = tokenInterface.networks[networkId].address
	}

	const MockTwitterOracle = new web3.eth.Contract(oracleInterface.abi, {data: oracleInterface.bytecode})//, {from: owner});
	const WokeToken = new web3.eth.Contract(tokenInterface.abi)//, {from: owner});

	let oracleServer, wt, to, mockTwitter, claimString;

	const accounts = await web3.eth.getAccounts();
	const [defaultAccount, owner, oraclize_cb, claimer, stranger_a, stranger_b, unclaimed, ...rest] = accounts;

	if(!to_address) {
		to = await MockTwitterOracle.deploy(
			{data: oracleInterface.bytecode, arguments: [oraclize_cb]}
		).send({
			from: owner,
			gas: gasLimit,
			gasPrice: gasPrice,
			value: web3.utils.toWei('0.5', 'ether')
		});
	} else {
		to = MockTwitterOracle;
		to.options.address = to_address
	}
	debug.m(`MockTwitterOracle deployed at ${to.options.address}`);

	if(!wt_address) {
		wt = await WokeToken.deploy(
			{data: tokenInterface.bytecode, arguments: [to.options.address, maxSupply]}
		).send({
			from: owner,
			gas: gasLimit,
			gasPrice: gasPrice
		});

	} else {
		wt = WokeToken;
		wt.options.address = wt_address
		// TODO check contract deployment status
	}
	debug.m(`WokeToken deployed at ${wt.options.address}`);

	let getwoketoke_account = await web3.eth.accounts.wallet.add('0x002e4d79c9725def6de38c72894e9339d697430242b8a60a563b0e96c39575ce');

	let users = {

		getwoketoke: {
			account: getwoketoke_account.address,
			handle: 'getwoketoke',
			id: getwoketoke_id
		},

		whalepanda: {
			account: claimer,
			handle: 'whalepanda',
			id: '10'
		},

		jack: {
			account: stranger_a,
			handle: 'jack',
			id: '11'
		},

		ayden: {
			account: stranger_b,
			handle: 'ayden',
			id: '12'
		}
	}


	for(let u of Object.values(users)) {
		debug.m(`With user @${u.handle}, id: ${u.id}, account: ${u.account} ...`);
		u.claimString = await genClaimString(web3, u.account, u.id) + ' garbage text';
		//debug.name(u.handle, u.claimString); 
	}

	mockTwitter = {
		initClient: async () => true,
		findClaimTweet: (handle) => new Promise((resolve, reject) => {
			setTimeout(() => resolve(users[handle].claimString), 1000)
		})
	}

	//oracleServer = new TinyOracle(web3, oracleInterface, to.options.address, networkId, {twitter: mockTwitter});
	oracleServer = new TinyOracle(web3, undefined, to.options.address, networkId, {twitter: mockTwitter});
	await oracleServer.start(oraclize_cb);
	debug.t('Started tiny-oracle.');

		//debug.name(u.handle, u.claimString); 

	if(simulate == true) {
		let opts = {from: undefined, gas: gasLimit, gasPrice: gasPrice};
		// Claim all users
		// fund woke toke
		let fundOpts = {...opts, from: defaultAccount, value: web3.utils.toWei('0.1', 'ether'), to: users.getwoketoke.account};
		debug.name('getwoketoke', fundOpts);
		let receipt = await web3.eth.sendTransaction(fundOpts);
		for(let u of Object.values(users)) {
			try {
				if(u.handle == 'getwoketoke') throw new Error('SKIP THIS USER');
				opts.from = u.account
				debug.name(u.handle, `Lodging claim from ${u.account}`);
				let r = await wt.methods.claimUser(u.id, u.handle).send(opts);
				let bn = r.blockNumber;
				let queryId = r.events['Lodged'].returnValues.queryId;
				debug.t('queryId: ', queryId);

				//debug.t('Waiting for oracle response...');
				const {returnValues: tweetStored} = await waitForEvent(to, 'TweetStored');
				debug.t('tweetStored: ', tweetStored.tweetText);
				r = await wt.methods._fulfillClaim(u.id).send(opts);
				debug.name(u.handle, 'Fulfilled claim.');
			} catch (err) {
				debug.err(err);
			}
		}


		// Send some claimed transactions
		opts.from = users.getwoketoke.account
		let r = await wt.methods.transferClaimed(users.jack.id, 1).send(opts);
		debug.m(`Sent`)
		opts.from = users.ayden.account
		r = await wt.methods.transferClaimed(users.getwoketoke.id, 4).send(opts);
		debug.m(`Sent`)

		unclaimedUser = {account: unclaimed, id: '12345', handle: 'dingus'}
		opts.from = users.getwoketoke.account
		r = await wt.methods.transferUnclaimed(unclaimedUser.id, 5).send(opts);
		debug.m(`Sent`)

		for(let u of Object.values(users)) {
			let balance = await wt.methods.balanceOf(u.account).call();
			debug.name(u.handle, `balance: ${balance} WOKE`);
		}
	}

}

module.exports = initClient;

if(debug.debug.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	const [simulate, ...rest] = argv;
	debug.h(`Send test transactoins? ${simulate}`);

	initClient(simulate ? true : false);
}

