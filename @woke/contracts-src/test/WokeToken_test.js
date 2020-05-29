const TwitterOracle = artifacts.require('TwitterOracle.sol')
const debug = require('./debug/WokeToken_test');
const { waitForEvent } = require('./utils');
const truffleAssert = require('truffle-assertions');
const printEvents = truffleAssert.prettyPrintEmittedEvents;
const {fromAscii, toWei, fromWei} = web3.utils;
const BN = require('bignumber.js');
const {
	web3Tools,
} = require('@woke/lib');

const UserRegistry = artifacts.require('UserRegistry.sol')
const WokeToken = artifacts.require('WokeToken.sol')
const WokeFormula = artifacts.require('WokeFormula.sol')
const LogNormalPDF = artifacts.require('LogNormalPDF.sol')
const Distribution = artifacts.require('Distribution.sol')
const Helpers = artifacts.require('Helpers.sol')
const MockTwitterOracle = artifacts.require('mocks/TwitterOracleMock.sol')

const appId = web3.utils.asciiToHex('0x0A'); // twitter
const getwoketoke_id = '932596541822419000';
const stranger_id = '12345';
const maxSupply = 4.2e6;
const claimArgs = u => [u.address, u.id, u.followers];

// IMPORTANT: Provable json syntax
// @getwoketoke id 932596541822419000
// JSONpath for multiple fields $.['full_text', 'user']

contract('UserRegistry', (accounts) => {
	const [defaultAccount, owner, oraclize_cb, claimer, tipAgent, stranger, cB, cC, ...rest] = accounts;

	const brokenUser = {address: stranger, id: '212312122', handle: 'jack', followers: 30000};
	const users = [
		{address: claimer, id: getwoketoke_id, handle: 'getwoketoke', followers: 100},
		{address: cC, id: '3313322', handle: 'yanggang', followers: 80e6},
		brokenUser,
		{address: rest[0], id: '1224927413284120212342141', handle: 'botman', followers: 1},
		{address: rest[1], id: '12249274132841202123429999', handle: 'megawhale', followers: Math.pow(2,32)-1}, // uint32 overflow
	];

	// Token Generation params
	const max_supply = 100000000;
	let UR, WT, TO, WF, LNDPF;
	let claimUser;
	let newUser = { address: claimer, followers: 10000, id: getwoketoke_id};

	async function joinEvent(newUser, tributors) {
		const claimUser = bindClaimUser(UR, TO, oraclize_cb);
		// 1. Claim all tributors
		for(t of tributors) {
			await claimUser(t);
		}

		// 2. Transfer tributes
		for(t of tributors) {
			let balance = await WT.balanceOf.call(t.address);
			console.log(balance);
			if(t.amount > balance) t.amount = balance;  // avoid reverts
			let r = await UR.transferUnclaimed(newUser.id, t.amount, {from: t.address});
		}

		// 3. User joins
		let r = await claimUser(newUser)

		// 4. check user bonuses
		// 5. check tributor bonuses
	}

	context('Using mock TwitterOracle', () => {
		before('Deploy WokeToken', async function() {
			WF = await WokeFormula.deployed();
			WT = await WokeToken.deployed();
			LNPDF = await LogNormalPDF.deployed();
		});

		beforeEach(async () => {
			debug.t('ctx1:beforeEach');
			TO = await MockTwitterOracle.new(oraclize_cb,
				{from: defaultAccount, value: web3.utils.toWei('0.01', 'ether')}
			);

			WT = await WokeToken.new(WF.address, maxSupply, {from: defaultAccount});
			UR = await UserRegistry.new(WT.address, LNPDF.address, TO.address, tipAgent, {from: defaultAccount})
			await WT.setUserRegistry(UR.address, {from: defaultAccount});
			claimUser = bindClaimUser(UR, TO, oraclize_cb);
		});

		describe('UserRegistry.sol', () => {
			///*
			describe('Helper Functions', () => {
				it('should parse valid claim strings', async () => {
					// TODO test several claim strings

					for(user of users) {
						let claimString = await genClaimString(user.address, user.id, user.followers);
						debug.t(claimString);
						//let result = await Helpers.deployed().then(h => h.verifyClaimString.call(user.address, user.id, claimString, appId));
						let result = await UR.verifyClaimString.call(user.address, user.id, claimString);
						assert.isTrue(result[0]);
						assert.strictEqual(result[1].toNumber(), user.followers); // if using
					}
				})
			})
			//*/

			describe('#claimUser', () => {
				context('with a single valid claim', () => {
					///*
					it('should submit a tweet request', async () => {

						let qe = waitForEvent(TO.LogNewQuery).then(e => {
							debug.v('LogNewQuery event:', e.returnValues);
						});

						let r = await UR.claimUser(getwoketoke_id, {from: claimer, value: web3.utils.toWei('1', 'ether')});
						let args = r.logs[r.logs.length - 1].args; // values of UR.Lodged event

						const queryId = args.queryId;

						debug.t('Lodged claim query with ID: ', queryId);

						assert.strictEqual(args.claimer, claimer);
						assert.strictEqual(args.userId, getwoketoke_id);

						// Check Oracle lodges request
					})
					//*/

					it('should fulfill a user claim', async () => {
						let user = brokenUser;
						UR.claimUser(user.id, {from: user.address});
						const {blockNumber, returnValues: {queryId: queryId}} = await waitForEvent(UR.Lodged);
						let claimString = await genClaimString(...claimArgs(user));

						let r = await TO.__callback(
							queryId,
							claimString,								// query result
							'0x0',	// proof
							{from: oraclize_cb}
						);

						console.log(`Sending _fulfillClaim(${user.id})...`);
						//debug(UR._fulfillClaim(user.id, {from: user.address}))
						r = await UR._fulfillClaim(user.id, {from: user.address});
						console.log(`_fulfillClaim(): ${r.receipt.gasUsed} gas used, cumulative: ${r.receipt.cumulativeGasUsed}`);
						//debug(UR._fulfillClaim(getwoketoke_id, {from: claimer}));
						//let claimed = (await waitForEvent(UR.Claimed)).returnValues;
						let claimed = (await UR.getPastEvents('Claimed', {from: blockNumber, to: 'latest'}))[0].args
						debug.v('event UserRegistry.Claimed:', claimed);

						assert.strictEqual(claimed.account, user.address);
						assert.strictEqual(claimed.userId, user.id);
						console.log('Claimed amount: ', claimed.amount.toString());
						//assert.strictEqual(claimed.amount, '50');
						assert(await UR.getUserCount.call(), 1);
					})

					it('should claim a user with zero followers', async () => {
						await claimUser({ ...newUser, followers: 0 });
					});

					//	/*
					it('should fail if a second claim is attempted', async () => {

						// Claim the user
						UR.claimUser(newUser.id, {from: newUser.address});
						let {returnValues: {queryId: queryId}} = await waitForEvent(UR.Lodged);

						let claimString = await genClaimString(...claimArgs(newUser));
						await TO.__callback(queryId, claimString, '0x0', {from: oraclize_cb});
						await UR._fulfillClaim(newUser.id, {from: newUser.address});

						// Attempt to claim the user again
						await truffleAssert.reverts(
							UR.claimUser(newUser.id, {from: newUser.address}),
							"sender already has user ID"
						);
						await truffleAssert.reverts(
							UR.claimUser(getwoketoke_id, {from: stranger}),
							"user already claimed"
						);
					})

					it('should fail if more than one claim request is made from same address', async () => {
						UR.claimUser(newUser.id, {from: newUser.address});
						let {returnValues: {queryId: queryId}} = await waitForEvent(UR.Lodged);

						// Attempt second request before Oracale __callback() called
						await truffleAssert.reverts(
							UR.claimUser(newUser.id, {from: newUser.address}),
							"sender already has a request pending"
						);
					})

					it('should fail if no oracle response has been received', async () => {
					})
					//*/
				})

				it('should claim several users', async () => {
					const cases = users;

					for(c of cases) {
						console.log(`Claiming ${cases.indexOf(c)}:${c.id}...`);
						let balance = await web3.eth.getBalance(c.address);
						//console.log(`Balance: ${web3.utils.fromWei(balance)}`);
						let r = await UR.claimUser(c.id, {from: c.address});
						let bn = r.receipt.blockNumber;
						let queryId = r.logs[r.logs.length-1].args.queryId;
						debug.t('queryId: ', queryId);

						let claimString = await genClaimString(c.address, c.id, c.followers);

						r = await TO.__callback(
							queryId,
							claimString,								// query result
							'0x0',	// proof
							{from: oraclize_cb}
						);

						//debug(UR._fulfillClaim(c.id, {from: c.address}));
						r = await UR._fulfillClaim(c.id, {from: c.address});
						console.log(`_fulfillClaim(): ${r.receipt.gasUsed} gas used, cumulative: ${r.receipt.cumulativeGasUsed}`);
						//debug(UR._fulfillClaim(getwoketoke_id, {from: claimer}));
						let claimed = (await UR.getPastEvents('Claimed', {from: bn, to: 'latest'}))[0].args
						console.log(`Claimed: ${claimed.amount.toString()} WOKE, Bonus: ${claimed.bonus.toString()} WOKE`);

						debug.v('event UserRegistry.Claimed:', claimed);

						assert.strictEqual(claimed.account, c.address);
						assert.strictEqual(claimed.userId, c.id);
						//assert.strictEqual(claimed.amount.toNumber(), 50); // if using

						assert(await UR.getUserCount.call(), cases.indexOf(c) + 1);
					}
					assert(await UR.getUserCount.call(), cases.length);
				})

				it('should reward referrers with a bonus', async () => {

					claimUser = bindClaimUser(UR, TO, oraclize_cb);

					const cases = [
						{address: cC, id: '3313322', handle: 'realdonaldtrump', followers: 50},
						{address: claimer, id: getwoketoke_id, handle: 'getwoketoke', followers: 100},
						{address: cB, id: '212312122', handle: 'jack', followers: 300},
					];

					let bonusUserClaimed; 
					let receipt;
					for(c of cases) {
						//const {claimed, _receipt} = await claimUser(c);
						const result = await claimUser(c);
						receipt = result.receipt;
						const claimed = result.claimed;
						//console.log(result)
						//receipt = _receipt;

						let cb = await WT.balanceOf.call(UR.address);
						debug.t('Contract balanace: ', cb.toString());

						let balance = await WT.balanceOf.call(c.address);
						debug.t('New user balance: ', balance.toString());
						if(c.id != cases[cases.length-1].id) {
							await UR.transferUnclaimed(cases[cases.length-1].id, 100, {from: c.address});
							c.balance = await WT.balanceOf.call(c.address)
							debug.t('User balance: ', c.balance.toString());
						} else {
							bonusUserClaimed = claimed;
						}
					}

					for(c of cases) {
						let bal = await WT.balanceOf.call(c.address);
						if(cases.indexOf(c) == cases.length -1) {
							let summoned = (await WT.getPastEvents('Summoned', {from: receipt.blockNumber, to: 'latest'}))[0].args
							console.log(`Minted: ${summoned.amount.toNumber()} Tribute bonus: ${summoned.amount.toNumber() - bonusUserClaimed.bonus.toNumber()}`);
							assert.equal(bal.toNumber(), bonusUserClaimed.bonus.toNumber() + 200);
						} else {
							console.log(`id:${`${c.id}`.padEnd(22)} prev: ${c.balance.toString()} new: ${bal.toString()}`);
							assert.isBelow(c.balance.toNumber(), bal.toNumber(), 'new greater less than before transfer')
						}
					}
				})

			})

			context('#tip', function() {
				const newUser = {
					address: claimer,
					followers: 3e6,
					id: getwoketoke_id,
				}

				const strangerUser = {
					address: stranger,
					followers: 3e6,
					id: stranger_id,
				}

				beforeEach(async function() {
					claimUser = bindClaimUser(UR, TO, oraclize_cb);
					await claimUser(newUser)
				})

				it('should be able to tip an unclaimed user', async function () {
					let r = await UR.tip(getwoketoke_id, stranger_id, 1, {from: tipAgent});
				})

				it('should be able to tip a claimed user', async function () {
					await claimUser(strangerUser)
					let r = await UR.tip(getwoketoke_id, stranger_id, 1, {from: tipAgent});
				})

				it('should revert if sender is not tip agent', async function () {
					await truffleAssert.reverts(
						UR.tip(getwoketoke_id, stranger_id, 1, {from: claimer}),
						"sender not tip agent"
					);

					await truffleAssert.reverts(
						UR.tip(getwoketoke_id, stranger_id, 1, {from: stranger}),
						"sender not tip agent"
					);
				})

				it('should revert if tip amount is zero', async function () {
					await truffleAssert.reverts(
						UR.tip(getwoketoke_id, stranger_id, 0, {from: tipAgent}),
						"cannot tip 0 tokens",
					)
				})

				it('should revert if senders balance is zero', async function () {
					const balance = (await WT.balanceOf.call(claimer)).toNumber();
					await UR.transferUnclaimed(stranger_id, balance, {from: claimer}); // Empty balance
					//await UR.tip(getwoketoke_id, stranger_id, 5, {from: tipAgent});
					await truffleAssert.reverts(
						UR.tip(getwoketoke_id, stranger_id, 5, {from: tipAgent}),
						"cannot tip 0 tokens",
					)
				})

				it('should succeed if tip amount is greater than users balance', async function () {
					const balance = (await WT.balanceOf.call(claimer)).toNumber();
					let r = await UR.tip(getwoketoke_id, stranger_id, balance + 4, {from: tipAgent}); // Empty balance
					const tipLog = r.logs[r.logs.length - 1];
					const tipAmount = tipLog.args.amount.toNumber();
					assert.strictEqual(balance, tipAmount);
				})

			})
		})
	})
})

// @param userObject: address, id, followersCount
const bindClaimUser = (UR, TO, oracleAddress) => async (userObject) => {
	let r = await UR.claimUser(userObject.id, {from: userObject.address});
	let bn = r.receipt.blockNumber;
	let queryId = r.logs[r.logs.length-1].args.queryId;
	debug.t('Claim queryId: ', queryId);
	const claimString = await genClaimString(...claimArgs(userObject));
	await TO.__callback(queryId, claimString, '0x0', {from: oracleAddress});
	console.log(`Sending _fulfillClaim( ${userObject.id} ) ...`);
	r = await UR._fulfillClaim(userObject.id, {from: userObject.address});
	console.log(`_fulfillClaim(): ${r.receipt.gasUsed} gas used, cumulative: ${r.receipt.cumulativeGasUsed}`);
	let claimed = (await UR.getPastEvents('Claimed', {from: bn, to: 'latest'}))[0].args
	console.log(`Claimed: ${claimed.amount.toString()} WOKE, Bonus: ${claimed.bonus.toString()} WOKE`);
	return { claimed, receipt: r.receipt };
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

	debug.h('Gen claim for: ', signatory, userId, followersCount);
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
	debug.h(`Oracle claim string: ${str}`);
	return str;
}

// Replicate Helper.verifyClaimString
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
