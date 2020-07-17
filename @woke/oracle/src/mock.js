// Client assumes that the Token is migrated and (paired with the mock oracle?)

const Web3 = require('web3');
const { Logger, protocol, web3Tools, twitter} = require('@woke/lib');
const assert = require('assert');
const waitForEvent = web3Tools.utils.waitForEventWeb3;
const twitterMock = require('../test/mocks/twitter-stub.mock');

const web3 = new Web3('ws://localhost:8545');
const genClaimString = protocol.genClaimString(web3);
const oracleInterface = require('../../contracts/development/TwitterOracleMock.json')
const tokenInterface = require('../../contracts/development/WokeToken.json')
const userRegistryInterface = require('../../contracts/development/UserRegistry.json')

const OracleSystem = require('./oracle-system');

const debug = Logger('mock-claim');

let networkId = 12; // client

//TODO get gas limit and price from web3
const gasPrice = '20000000000';
const gasLimit = '6721975';
const maxSupply = 200000;
const getwoketoke_id = '932596541822419000'; // Ambassador twitter account
const makeUsers = require('../test/mocks/users');

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
	if(userRegistryInterface.networks[networkId].address) {
		wt_address = userRegistryInterface.networks[networkId].address
	}

	const MockTwitterOracle = new web3.eth.Contract(oracleInterface.abi, {data: oracleInterface.bytecode})//, {from: owner});
	const UserRegistry = new web3.eth.Contract(userRegistryInterface.abi)//, {from: owner});

	let oracleServer, wt, to, mockTwitter, claimString;

	const accounts = await web3.eth.getAccounts();
	const [defaultAccount, owner, oraclize_cb, claimer, stranger_a, stranger_b, unclaimed, ...rest] = accounts;
	let users = makeUsers(accounts);

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
		wt = await UserRegistry.deploy(
			{data: tokenInterface.bytecode, arguments: [to.options.address, maxSupply]}
		).send({
			from: owner,
			gas: gasLimit,
			gasPrice: gasPrice
		});

	} else {
		wt = UserRegistry;
		wt.options.address = wt_address
		// TODO check contract deployment status
	}
	debug.m(`UserRegistry deployed at ${wt.options.address}`);

	let getwoketoke_account = await web3.eth.accounts.wallet.add('0x002e4d79c9725def6de38c72894e9339d697430242b8a60a563b0e96c39575ce');

	for(let u of Object.values(users)) {
		debug.m(`With user @${u.handle}, id: ${u.id}, account: ${u.account} ...`);
		u.claimString = await genClaimString(u.account, u.id, u.followers_count) + ' garbage text';
		//debug.name(u.handle, u.claimString); 
	}
	
	const twitterClient = twitterMock.createMockClient(users);

	//await oracleServer.start(oraclize_cb);
	// TODO pass oraclize_cb to oracle system
	const oracleSystem = new OracleSystem(undefined, { persist: false, twitterClient, subscriptionWatchdogInterval: 5000 });
	oracleSystem.start();

	if(simulate == true) {
		let opts = {from: undefined, gas: gasLimit, gasPrice: gasPrice};
		// Claim all users
		// fund woke toke
		let fundOpts = {...opts, from: defaultAccount, value: web3.utils.toWei('0.1', 'ether'), to: users.getwoketoke.account};
		debug.name('getwoketoke', fundOpts);
		let receipt = await web3.eth.sendTransaction(fundOpts);
		for(let u of Object.values(users)) {
			try {
				//if(u.handle == 'getwoketoke') throw new Error('SKIP THIS USER');
				opts.from = u.account
				debug.name(u.handle, `Lodging claim from ${u.account}`);
				let r = await wt.methods.claimUser(u.id).send(opts);
				let bn = r.blockNumber;
				let queryId = r.events['Lodged'].returnValues.queryId;
				debug.t('queryId: ', queryId);

				//debug.t('Waiting for oracle response...');
				const {returnValues: tweetStored} = await waitForEvent(to, 'TweetStored');
				debug.t('tweetStored: ', tweetStored.tweetText);
				r = await wt.methods._fulfillClaim(u.id).send(opts);
				debug.name(u.handle, 'Fulfilled claim.');
			} catch (err) {
				debug.error(err);
			}
		}

		// Send some claimed transactions
		opts.from = users.getwoketoke.account
		let r = await wt.methods.transferClaimed(users.jack.id, 1).send(opts);
		debug.m(`Sent`)
		opts.from = users.denk.account
		r = await wt.methods.transferClaimed(users.getwoketoke.id, 4).send(opts);
		debug.m(`Sent`)

		unclaimedUser = {account: unclaimed, id: '12345', handle: 'dingus'}
		opts.from = users.getwoketoke.account
		r = await wt.methods.transferUnclaimed(unclaimedUser.id, 5).send(opts);
		debug.m(`Sent`)

		for(let u of Object.values(users)) {
			let balance = await wt.methods.balanceOf(u.id).call();
			debug.name(u.handle, `balance: ${balance} WOKE`);
		}
	}

}

module.exports = initClient;

if(require.main === module) {
	var argv = process.argv.slice(2);
	const [simulate, ...rest] = argv;
	debug.h(`Send test transactoins? ${simulate}`);

	initClient(simulate ? true : false);
}

