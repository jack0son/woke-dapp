const TwitterOracle = artifacts.require('TwitterOracle.sol')
const debug = require('./debug/WokeToken_test');
const { waitForEvent } = require('./utils');
const truffleAssert = require('truffle-assertions');

const printEvents = truffleAssert.prettyPrintEmittedEvents;

const {fromAscii, toWei} = web3.utils;
const BN = web3.BN;

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
const stranger_user_id = '12345';

contract('WokeToken', (accounts) => {
	const [defaultAccount, owner, oraclize_cb, claimer, stranger, cB, cC, ...rest] = accounts;

	// Token Generation params
	const max_supply = 100000000;
	let wt, to;
	let claimUser;

	context('Using mock TwitterOracle', () => {
		beforeEach(async () => {
			debug.t('context 1: before each');
			to = await MockTwitterOracle.new(oraclize_cb,
				{from: owner, value: web3.utils.toWei('0.1', 'ether')}
			);

			wt = await WokeToken.new(to.address, owner, max_supply, {from: owner})
		});

		describe('WokeToken.sol', () => {

			describe('Helper Functions', () => {
				it('should verify a valid claim string', async () => {
					let claimString = await genClaimString(claimer, getwoketoke_id);
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
						let claimString = await genClaimString(claimer, getwoketoke_id);

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

						let claimString = await genClaimString(claimer, getwoketoke_id);
						await to.__callback(queryId, claimString, '0x0', {from: oraclize_cb});
						await wt._fulfillClaim(getwoketoke_id);

						// Attempt to claim the user again
						await truffleAssert.reverts(
							wt.claimUser(getwoketoke_id, {from: claimer}),
							"Sender already has user ID"
						);
						await truffleAssert.reverts(
							wt.claimUser(getwoketoke_id, {from: stranger}),
							"User already claimed"
						);
					})

					it('should fail if more than one claim request is made from same address', async () => {
						wt.claimUser(getwoketoke_id, {from: claimer});
						let {returnValues: {queryId: queryId}} = await waitForEvent(wt.Lodged);

						// Attempt second request before Oracale __callback() called
						await truffleAssert.reverts(
							wt.claimUser(getwoketoke_id, {from: claimer}),
							"Sender already has a request pending"
						);
					})

					it('should fail if no oracle response has been received', async () => {
					})
				})

				it('should claim several users', async () => {
					const cases = [
						{address: cB, id: '212312122', handle: 'jack'},
						{address: cC, id: '3313322', handle: 'realdonaldtrump'},
						{address: claimer, id: getwoketoke_id, handle: 'getwoketoke'},
					];

					for(c of cases) {
						let r = await wt.claimUser(c.id, {from: c.address});
						let bn = r.receipt.blockNumber;
						let queryId = r.logs[r.logs.length-1].args.queryId;
						debug.t('queryId: ', queryId);

						let claimString = await genClaimString(c.address, c.id);

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
						{address: cB, id: '212312122', handle: 'jack'},
						{address: cC, id: '3313322', handle: 'realdonaldtrump'},
						{address: claimer, id: getwoketoke_id, handle: 'getwoketoke'},
					];

					for(c of cases) {
						let r = await wt.claimUser(c.id, {from: c.address});
						let bn = r.receipt.blockNumber;
						let queryId = r.logs[r.logs.length-1].args.queryId;
						debug.t('queryId: ', queryId);

						let claimString = await genClaimString(c.address, c.id);

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
				beforeEach(async function() {
					claimUser = bindClaimUser(wt, to, oraclize_cb);
					await claimUser(claimer, getwoketoke_id)
				})

				it('should be able to tip an unclaimed user', async function () {
					let r = await wt.tip(getwoketoke_id, stranger_user_id, 1, {from: owner});
				})

				it('should be able to tip a claimed user', async function () {
					await claimUser(stranger, stranger_user_id)
					let r = await wt.tip(getwoketoke_id, stranger_user_id, 1, {from: owner});
				})

				it('should fail if sender is not tip agent', async function () {
				})

				it('if tip amount is zero', async function () {
				})

				it('if tippers balance is zero', async function () {
				})

				it('if tip amount is greater than users balance', async function () {
				})

			})

			describe('#tip', () => {

			})
		})
	})
})

const bindClaimUser = (wt, to, oracleAddress) => async (claimAddress, userId) => {
	let r = await wt.claimUser(userId, {from: claimAddress});
	// let bn = r.receipt.blockNumber;
	let queryId = r.logs[r.logs.length-1].args.queryId;
	debug.t('Claim queryId: ', queryId);
	const claimString = await genClaimString( claimAddress, userId);
	await to.__callback(queryId, claimString, '0x0', {from: oracleAddress});
	await wt._fulfillClaim(userId, {from: claimAddress});
}


// Generate Woke Auth Token
const example = '@getwoketoke 0xwoke:1224421374322,0x12312377134319222222312,1'
// message_to_sign = <address><userId><appId>
// token = '@getwoketoke 0xwoke:<userId>,<signature>,
async function genClaimString(signatory, userId, app = 'twitter') {
	const appId = {
		'default' : 0,
		'twitter' : 10,
		'youtube' : 20,
		'reddit' : 30
	}

	let msgHash = web3.utils.soliditySha3(
		{t: 'uint256', v: signatory}, 
		{t: 'string', v: userId},
		{t: 'uint8', v: appId[app]}
	).toString('hex');
	//debug.h('msgHash: ', msgHash);

	const sig = await web3.eth.sign(msgHash, signatory);

	//debug.h(`Signature for ${signatory}, uid ${userId}\n${sig}`);

	let str = `@getwoketoke 0xWOKE:${userId},${sig},1`;
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
