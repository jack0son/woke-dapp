const TwitterOracle = artifacts.require('TwitterOracle.sol')
const debug = require('./debug/WokeToken_test');
const { waitForEvent } = require('./utils');
const truffleAssert = require('truffle-assertions');
let {
	web3Tools,
} = require('@woke/lib');

const printEvents = truffleAssert.prettyPrintEmittedEvents;

const {fromAscii, toWei} = web3.utils;
const BN = require('bignumber.js');

//const Web3 = require('web3')
//const web3ws = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:9545'))


/* Create user flow
 *		1. User authenticates with oAuth
 *		2. New wallet created for user
 *		3. API retreives user ID
 *		4. Wallet used to sign address and create claim string
 *		5. Claim string is posted to twitter
 *		6. Extension retreives tweet id
 *		7. Extension creates claim user transaction
 *		8. Extension background waits for claim fullfillment
 */

// IMPORTANT: the twitter query must include the user's id
// @getwoketoke id 932596541822419000
// JSONpath for multiple fields $.['full_text', 'user']


// IMPORTANT TEST CASES
/*
 *	- fulfill claim sent from who
 *
 *
 *
 */

const WokeToken = artifacts.require('WokeToken.sol')
const MockTwitterOracle = artifacts.require('mocks/TwitterOracleMock.sol')

const getwoketoke_id = '932596541822419000';
const stranger_id = '12345';

contract('WokeToken', (accounts) => {
	const [defaultAccount, owner, oraclize_cb, claimer, tipAgent, stranger, cB, cC, ...rest] = accounts;

	// Token Generation params
	const max_supply = 100000000;
	let wt, to;
	let claimUser;
	let newUser = {};
	let claimArgs = [];

	context('Using mock TwitterOracle', () => {
		beforeEach(async () => {
			debug.t('context 1: before each');
			to = await MockTwitterOracle.new(oraclize_cb,
				{from: owner, value: web3.utils.toWei('0.1', 'ether')}
			);

			wt = await WokeToken.new(to.address, tipAgent, max_supply, {from: owner})
		});

		newUser = { address: claimer, followers: 1000000, id: getwoketoke_id};
		claimArgs = [newUser.address, newUser.id, newUser.followers];
		

		describe('WokeToken.sol', () => {

			describe('Helper Functions', () => {
				it('should verify a valid claim string', async () => {
					let claimString = await genClaimString(...claimArgs);
					console.log(claimString);
					let result = await wt.verifyClaimString.call(claimer, getwoketoke_id, claimString);
					assert.isTrue(result);
				})
			})

			describe('#claimUser', () => {
				context('with a single valid claim', () => {
					it('should submit a tweet request', async () => {

						let qe = waitForEvent(to.LogNewQuery).then(e => {
							debug.v('LogNewQuery event:', e.returnValues);
						});

						let r = await wt.claimUser(getwoketoke_id, {from: claimer, value: web3.utils.toWei('1', 'ether')});
						let args = r.logs[r.logs.length - 1].args; // values of wt.Lodged event

						const queryId = args.queryId;

						debug.t('Lodged claim query with ID: ', queryId);

						assert.strictEqual(args.claimer, claimer);
						assert.strictEqual(args.userId, getwoketoke_id);

						// Check Oracle lodges request
					})

					it('should claim the user', async () => {

						wt.claimUser(getwoketoke_id, {from: claimer});
						const {returnValues: {queryId: queryId}} = await waitForEvent(wt.Lodged);
						let claimString = await genClaimString(...claimArgs);

						let r = await to.__callback(
							queryId,
							claimString,								// query result
							'0x0',	// proof
							{from: oraclize_cb}
						);

						wt._fulfillClaim(getwoketoke_id, {from: claimer});
						let claimed = (await waitForEvent(wt.Claimed)).returnValues;
						debug.v('event WokeToken.Claimed:', claimed);

						assert.strictEqual(claimed.account, claimer);
						assert.strictEqual(claimed.userId, getwoketoke_id);
						assert.strictEqual(claimed.amount, '50');
						assert(await wt.getUserCount.call(), 1);
					})

					it('should fail if a second claim is attempted', async () => {

						// Claim the user
						wt.claimUser(getwoketoke_id, {from: claimer});
						let {returnValues: {queryId: queryId}} = await waitForEvent(wt.Lodged);

						let claimString = await genClaimString(...claimArgs);
						await to.__callback(queryId, claimString, '0x0', {from: oraclize_cb});
						await wt._fulfillClaim(getwoketoke_id);

						// Attempt to claim the user again
						await truffleAssert.reverts(
							wt.claimUser(getwoketoke_id, {from: claimer}),
							"sender already has user ID"
						);
						await truffleAssert.reverts(
							wt.claimUser(getwoketoke_id, {from: stranger}),
							"user already claimed"
						);
					})

					it('should fail if more than one claim request is made from same address', async () => {
						wt.claimUser(getwoketoke_id, {from: claimer});
						let {returnValues: {queryId: queryId}} = await waitForEvent(wt.Lodged);

						// Attempt second request before Oracale __callback() called
						await truffleAssert.reverts(
							wt.claimUser(getwoketoke_id, {from: claimer}),
							"sender already has a request pending"
						);
					})

					it('should fail if no oracle response has been received', async () => {
					})
				})

				it('should claim several users', async () => {
					const cases = [
						{address: cB, id: '212312122', handle: 'jack', followers: 30000},
						{address: cC, id: '3313322', handle: 'realdonaldtrump', followers: 80e6},
						{address: claimer, id: getwoketoke_id, handle: 'getwoketoke', followers: 100},
					];

					for(c of cases) {
						let r = await wt.claimUser(c.id, {from: c.address});
						let bn = r.receipt.blockNumber;
						let queryId = r.logs[r.logs.length-1].args.queryId;
						debug.t('queryId: ', queryId);

						let claimString = await genClaimString(c.address, c.id, c.followers);

						r = await to.__callback(
							queryId,
							claimString,								// query result
							'0x0',	// proof
							{from: oraclize_cb}
						);

						await wt._fulfillClaim(c.id, {from: c.address});
						let claimed = (await wt.getPastEvents('Claimed', {from: bn, to: 'latest'}))[0].args

						debug.v('event WokeToken.Claimed:', claimed);

						assert.strictEqual(claimed.account, c.address);
						assert.strictEqual(claimed.userId, c.id);
						assert.strictEqual(claimed.amount.toNumber(), 50); // if using

						assert(await wt.getUserCount.call(), cases.indexOf(c) + 1);
					}
					assert(await wt.getUserCount.call(), cases.length);
				})

				it('should reward referrers with a bonus', async () => {
					const cases = [
						{address: cB, id: '212312122', handle: 'jack', followers: 30000},
						{address: cC, id: '3313322', handle: 'realdonaldtrump', followers: 80e6},
						{address: claimer, id: getwoketoke_id, handle: 'getwoketoke', followers: 100},
					];

					for(c of cases) {
						let r = await wt.claimUser(c.id, {from: c.address});
						let bn = r.receipt.blockNumber;
						let queryId = r.logs[r.logs.length-1].args.queryId;
						debug.t('queryId: ', queryId);

						let claimString = await genClaimString(c.address, c.id, c.followers);

						r = await to.__callback(
							queryId,
							claimString,								// query result
							'0x0',	// proof
							{from: oraclize_cb}
						);

						await wt._fulfillClaim(c.id, {from: c.address});
						let claimed = (await wt.getPastEvents('Claimed', {from: bn, to: 'latest'}))[0].args
						debug.v('event WokeToken.Claimed:', claimed);

						let cb = await wt.balanceOf.call(wt.address);
						debug.t('Contract bal: ', cb.toString());

						let balance = await wt.balanceOf.call(c.address);
						debug.t(balance.toString());
						if(c.id != getwoketoke_id) {
							await wt.transferUnclaimed(cases[cases.length-1].id, 5, {from: c.address});
						debug.t((await wt.balanceOf.call(c.address)).toString());
						} 
					}

					for(c of cases) {
						let bal = await wt.balanceOf.call(c.address);
						debug.t(bal.toString());
					}
				})

			})

			context('#tip', function() {
				const newUser = {
					address: claimer,
					followers: 3e6,
					id: getwoketoke_id,
				}
				beforeEach(async function() {
					claimUser = bindClaimUser(wt, to, oraclize_cb);
					await claimUser(claimer, getwoketoke_id)
				})

				it('should be able to tip an unclaimed user', async function () {
					let r = await wt.tip(getwoketoke_id, stranger_id, 1, {from: tipAgent});
				})

				it('should be able to tip a claimed user', async function () {
					await claimUser(stranger, stranger_id)
					let r = await wt.tip(getwoketoke_id, stranger_id, 1, {from: tipAgent});
				})

				it('should revert if sender is not tip agent', async function () {
					await truffleAssert.reverts(
						wt.tip(getwoketoke_id, stranger_id, 1, {from: claimer}),
						"sender not tip agent"
					);

					await truffleAssert.reverts(
						wt.tip(getwoketoke_id, stranger_id, 1, {from: stranger}),
						"sender not tip agent"
					);
				})

				it('should revert if tip amount is zero', async function () {
					await truffleAssert.reverts(
						wt.tip(getwoketoke_id, stranger_id, 0, {from: tipAgent}),
						"cannot tip 0 tokens",
					)
				})

				it('should revert if senders balance is zero', async function () {
					const balance = (await wt.balanceOf.call(claimer)).toNumber();
					await wt.transferUnclaimed(stranger_id, balance, {from: claimer}); // Empty balance
					//await wt.tip(getwoketoke_id, stranger_id, 5, {from: tipAgent});
					await truffleAssert.reverts(
						wt.tip(getwoketoke_id, stranger_id, 5, {from: tipAgent}),
						"cannot tip 0 tokens",
					)
				})

				it('should succeed if tip amount is greater than users balance', async function () {
					const balance = (await wt.balanceOf.call(claimer)).toNumber();
					let r = await wt.tip(getwoketoke_id, stranger_id, balance + 4, {from: tipAgent}); // Empty balance
					const tipLog = r.logs[r.logs.length - 1];
					const tipAmount = tipLog.args.amount.toNumber();
					assert.strictEqual(balance, tipAmount);
				})

			})
		})
	})
})

// @param userObject: address, id, followersCount
const bindClaimUser = (wt, to, oracleAddress) => async (userObject) => {
	let r = await wt.claimUser(userObject.userId, {from: userObject.address});
	const claimArgs = [userObject.address, userObject.userId, userObject.followersCount];
	// let bn = r.receipt.blockNumber;
	let queryId = r.logs[r.logs.length-1].args.queryId;
	debug.t('Claim queryId: ', queryId);
	const claimString = await genClaimString(...claimArgs);
	await to.__callback(queryId, claimString, '0x0', {from: oracleAddress});
	await wt._fulfillClaim(userId, {from: userObject.address});
}


// Generate Woke Auth Token
const example = '@getwoketoke 0xwoke:1224421374322,0x12312377134319222222312,1'
// message_to_sign = <address><userId><appId>
// token = '@getwoketoke 0xwoke:<userId>,<signature>,
async function genClaimString(signatory, userId, followersCount, app = 'twitter') {
	const appId = {
		'default' : 0,
		'twitter' : 10,
		'youtube' : 20,
		'reddit' : 30
	}

	console.log('Gen claim for: ', signatory, userId, followersCount);
	let followersCountHex = web3Tools.utils.uInt32ToHexString(followersCount);

	let msgHash = web3.utils.soliditySha3(
		{t: 'uint256', v: signatory}, 
		{t: 'string', v: userId},
		{t: 'uint8', v: appId[app]}
	).toString('hex');
	//debug.h('msgHash: ', msgHash);

	const sig = await web3.eth.sign(msgHash, signatory);

	//debug.h(`Signature for ${signatory}, uid ${userId}\n${sig}`);

	let str = `@getwoketoke 0xWOKE:${userId},${sig},1:${followersCountHex}`;
	debug.h(`Gen. claim string: ${str}`);
	return str;
}

function signOrder(amount, nonce, callback) {
	var hash = "0x" + ethereumjs.ABI.soliditySHA3(
		["address", "uint256", "uint256"],
		[web3.eth.defaultAccount, amount, nonce]
	).toString("hex");
	web3.personal.sign(hash, web3.eth.defaultAccount, callback);
}

const sign = (address, dataToSign) => {
	return new Promise((resolve, reject) => {
		;
	});
}

//web3.eth.sign(address, dataToSign, [, callback])
