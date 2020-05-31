const { waitForEvent, genRandomUserId } = require('./utils');
const truffleAssert = require('truffle-assertions');
const printEvents = truffleAssert.prettyPrintEmittedEvents;
const {fromAscii, toWei, fromWei} = web3.utils;
const BN = require('bignumber.js');
const {
	//web3Tools,
	Logger,
} = require('@woke/lib');
logger = Logger('UR');

const UserRegistry = artifacts.require('UserRegistry.sol')
const WokeToken = artifacts.require('WokeToken.sol')
const WokeFormula = artifacts.require('WokeFormula.sol')
const LogNormalPDF = artifacts.require('LogNormalPDF.sol')
const Distribution = artifacts.require('Distribution.sol')
const Helpers = artifacts.require('Helpers.sol')
const MockTwitterOracle = artifacts.require('mocks/TwitterOracleMock.sol')
//const TwitterOracle = artifacts.require('TwitterOracle.sol')

const wokeFormulaConfig = require('../config/WokeFormula').alpha;
const tributorData = require('../distribution/data-tributors');
const appId = web3.utils.asciiToHex('0x0A'); // twitter
const getwoketoke_id = '932596541822419000';
const stranger_id = '12345';

// IMPORTANT: Provable json syntax
// JSONpath for multiple fields $.['full_text', 'user']

// @dev Using BN.toNumber() for asserts is not technically correct as there
// could be overflow.
// @TODO:
//	- test token minting on second half of bonding curve
//	- stress test very large number of users


const bindHarness = require('./harness');

contract('UserRegistry', (accounts) => {
	let UR, WT, TO, WF, LNDPF;
	const [defaultAccount, owner, oraclize_cb, claimer, tipAgent, stranger, cA, cB, cC, cD, ...rest] = accounts;
	let { claimArgs, genClaimString, bindClaimUser, bindJoinWithTributes } = bindHarness(accounts, {
		UR, WT, TO, WF, LNDPF,
	}, wokeFormulaConfig);
	let claimUser;

	let newUser = {address: cA, id: '212312122', handle: 'jack', followers: 30000};
	const users = [
		newUser,
		{address: claimer, id: getwoketoke_id, handle: 'getwoketoke', followers: 100},
		{address: cC, id: '3313322', handle: 'yanggang', followers: 80e6},
		{address: cD, id: '1224927413284120212342141', handle: 'botman', followers: 1},
		{address: cB, id: '12249274132841202123429999', handle: 'megawhale', followers: Math.pow(2,32)-1}, // uint32 overflow
	];

	context('Using mock TwitterOracle', () => {
		before('Deploy WokeToken', async function() {
			WF = await WokeFormula.deployed();
			WT = await WokeToken.deployed();
			LNPDF = await LogNormalPDF.deployed();
		});

		beforeEach(async () => {
			//logger.t('ctx1:beforeEach');
			TO = await MockTwitterOracle.new(oraclize_cb,
				{from: defaultAccount, value: web3.utils.toWei('0.01', 'ether')}
			);

			WT = await WokeToken.new(WF.address, wokeFormulaConfig.maxSupply, {from: defaultAccount});
			UR = await UserRegistry.new(WT.address, LNPDF.address, TO.address, tipAgent, wokeFormulaConfig.maxTributors, {from: defaultAccount})
			await WT.setUserRegistry(UR.address, {from: defaultAccount});
			const ctx = bindHarness(accounts, {
				UR, WT, TO, WF, LNDPF,
			}, wokeFormulaConfig);
			bindClaimUser = ctx.bindClaimUser;
			bindJoinWithTributes = ctx.bindJoinWithTributes;
			claimUser = bindClaimUser(UR, TO, oraclize_cb);
		});

		describe('UserRegistry.sol', () => {
			describe('Helper Functions', () => {
				it('should parse valid claim strings', async () => {
					for(user of users) {
						let claimString = await genClaimString(user.address, user.id, user.followers);
						logger.info(claimString);
						let result = await UR.verifyClaimString.call(user.address, user.id, claimString);
						assert.isTrue(result[0]);
						assert.strictEqual(result[1].toNumber(), user.followers); // if using
					}
				})

				it('should reject invalid claim strings', async () => {
					// @TODO
				})
			})

			describe('#claimUser', () => {
				it('should submit a tweet request', async () => {

					let qe = waitForEvent(TO.LogNewQuery).then(e => {
						logger.e('LogNewQuery event:', e.returnValues);
					});

					let r = await UR.claimUser(getwoketoke_id, {from: claimer, value: web3.utils.toWei('1', 'ether')});
					let args = r.logs[r.logs.length - 1].args; // values of UR.Lodged event

					const queryId = args.queryId;

					logger.t('Lodged claim query with ID: ', queryId);

					assert.strictEqual(args.claimer, claimer);
					assert.strictEqual(args.userId, getwoketoke_id);

					// Check Oracle lodges request
				})
				//


				it('should claim a user with zero followers', async () => {
					await claimUser({ ...newUser, followers: 0 });
				});

				//	/*
				it('should fail if a second claim is attempted', async () => {
					await claimUser(newUser);

					// Attempt to claim the user again
					await truffleAssert.reverts(
						UR.claimUser(newUser.id, {from: newUser.address}),
						"sender already has user ID"
					);
					await truffleAssert.reverts(
						UR.claimUser(newUser.id, {from: stranger}),
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



				it('should claim several users', async () => {
					const cases = users;

					for(c of cases) {
						logger.info(`Claiming ${cases.indexOf(c)}:${c.id}...`);
						let balance = await web3.eth.getBalance(c.address);
						//console.log(`Balance: ${web3.utils.fromWei(balance)}`);
						let r = await UR.claimUser(c.id, {from: c.address});
						let bn = r.receipt.blockNumber;
						let queryId = r.logs[r.logs.length-1].args.queryId;
						logger.info(`\t${c.id}, queryId: ${queryId}`);

						let claimString = await genClaimString(c.address, c.id, c.followers);

						r = await TO.__callback(
							queryId,
							claimString,								// query result
							'0x0',	// proof
							{from: oraclize_cb}
						);

						//debug(UR._fulfillClaim(c.id, {from: c.address})); // truffle-debug
						r = await UR._fulfillClaim(c.id, {from: c.address});
						logger.t(`_fulfillClaim(): ${r.receipt.gasUsed} gas used, cumulative: ${r.receipt.cumulativeGasUsed}`);
						//logger(UR._fulfillClaim(getwoketoke_id, {from: claimer}));
						let claimed = (await UR.getPastEvents('Claimed', {from: bn, to: 'latest'}))[0].args
						logger.t(`Claimed: ${claimed.amount.toString()} WOKE, Bonus: ${claimed.bonus.toString()} WOKE`);

						logger.e('UserRegistry.Claimed:', claimed);

						assert.strictEqual(claimed.account, c.address);
						assert.strictEqual(claimed.userId, c.id);
						//assert.strictEqual(claimed.amount.toNumber(), 50); // if using

						assert(await UR.getUserCount.call(), cases.indexOf(c) + 1);
					}
					assert(await UR.getUserCount.call(), cases.length);
				})

				it('should reward tributors with a bonus', async () => {

					claimUser = bindClaimUser(UR, TO, oraclize_cb);

					const cases = [
						{address: cC, id: '3313322', handle: 'yanggang', followers: 50},
						{address: claimer, id: getwoketoke_id, handle: 'getwoketoke', followers: 100},
						{address: cB, id: '212312122', handle: 'jack', followers: 300},
					];

					let bonusUserClaimed; 
					let receipt;
					let tributeTotal = 0;
					for(c of cases) {
						//const {claimed, _receipt} = await claimUser(c);
						const result = await claimUser(c);
						receipt = result.receipt;
						const claimed = result.claimed;
						//console.log(result)
						//receipt = _receipt;

						let cb = await WT.balanceOf.call(UR.address);
						logger.info('Contract balanace: ', cb.toString());

						let balance = await WT.balanceOf.call(c.address);
						logger.info('New user balance: ', balance.toString());
						if(c.id != cases[cases.length-1].id) {
							await UR.transferUnclaimed(cases[cases.length-1].id, balance, {from: c.address});
							tributeTotal += balance;
							c.balance = await WT.balanceOf.call(c.address)
							logger.info('User balance: ', c.balance.toString());
						} else {
							bonusUserClaimed = claimed;
						}
					}

					for(c of cases) {
						let bal = await WT.balanceOf.call(c.address);
						if(cases.indexOf(c) == cases.length -1) {
							let summoned = (await WT.getPastEvents('Summoned', {from: receipt.blockNumber, to: 'latest'}))[0].args
							logger.t(`Minted: ${summoned.amount.toNumber()} Tribute bonus: ${summoned.amount.toNumber() - bonusUserClaimed.bonus.toNumber()}`);
							assert.equal(bal.toNumber(), bonusUserClaimed.bonus.toNumber() + tributeTotal);
						} else {
							logger.t(`id:${`${c.id}`.padEnd(22)} prev: ${c.balance.toString()} new: ${bal.toString()}`);
							assert.isBelow(c.balance.toNumber(), bal.toNumber(), 'new greater less than before transfer')
						}
					}
				})

				it('should distribute bonuses to tributors', async () => {
					// Fund tributors
					const tributors = [];
					let i = 0;
					for(t of tributorData.whale) {
						if(i > rest.length - 1) 
							break;
						t.address = rest[i];
						t.id = genRandomUserId();
						tributors.push(t);
						i++;
					}

					await bindJoinWithTributes(claimUser)(newUser, tributors);
				});

				it('should accumulate multiple tributes', async () => {

					const cases = [
						{address: cC, id: '3313322', handle: 'yanggang', followers: 50},
						{address: claimer, id: getwoketoke_id, handle: 'getwoketoke', followers: 100},
						{address: cB, id: '212312122', handle: 'jack', followers: 300},
					];

					const recipient = cases[cases.length - 1];

					let bonusUserClaimed; 
					let receipt;
					let contractBalance;
					let totalSent = 0;
					for(c of cases.slice(0, cases.length - 1)) {
						const result = await claimUser(c);
						receipt = result.receipt;
						const claimed = result.claimed;


						let balance = await WT.balanceOf.call(c.address);
						let amount = Math.trunc(balance.toNumber()/2);
						await UR.transferUnclaimed(recipient.id, amount, {from: c.address});
						await UR.transferUnclaimed(recipient.id, amount, {from: c.address});
						totalSent += amount*2;

						let unclaimedBalance = await UR.unclaimedBalanceOf.call(recipient.id); 
						contractBalance = await WT.balanceOf.call(UR.address);
						assert.equal(totalSent, unclaimedBalance, `Unclaimed balance not equal to amount sent`);
						assert.equal(contractBalance.toNumber(), unclaimedBalance.toNumber(), `Unclaimed balance not equal to contract's balance`);
					}

					let r = await claimUser(recipient);
					let tributeReceived = r.claimed.amount - r.claimed.bonus;
					logger.t(`Tribute received ${tributeReceived}`);
					assert.equal(tributeReceived, totalSent, 'Tributes received not equal to tributes sent');
				})

				/*
				let tributorsSample = tributorData.symmetric.slice(0, rest.length);
				it(`should not revert when exceeding maximum number of tributors (using ${tributorsSample.length})`, async () => {
					// Fund tributors
					const tributors = [];
					let ids = [];
					let i = 0;

					for(t of tributorsSample) {
						t.address = rest[i];
						t.id = genRandomUserId(ids);
						ids.push(t.id);
						tributors.push(t);
						i++;
					}

					let exists = {};
					for(t of tributors) {
						if(exists[t.address] == true) {
							logger.error(`${tributors.indexOf(t)}: ${t.address}, ${t.id} EXISTS`)
							throw new Error('Using non-unique address for tributor');
						}
						exists[t.address] = true;
					}

					logger.t(`joinWithTributes with ${tributors.length} tributors...`);
					await bindJoinWithTributes(claimUser)(newUser, tributors);
				});
				*/
				})
			describe('#_fulfillClaim', () => {
				it('should fail if no claim lodged', async () => {
					let user = newUser;

					logger.t(`Sending _fulfillClaim(${user.id})...`);
					//logger(UR._fulfillClaim(user.id, {from: user.address}))
					await truffleAssert.reverts(
						UR._fulfillClaim(user.id, {from: user.address}),
						"sender has no request pending"
					);
				})

				it('should fail if oracle has not responded', async () => {
					let user = newUser;
					await UR.claimUser(user.id, {from: user.address});

					logger.t(`Sending _fulfillClaim(${user.id})...`);
					//logger(UR._fulfillClaim(user.id, {from: user.address}))
					await truffleAssert.reverts(
						UR._fulfillClaim(user.id, {from: user.address}),
						"claim string not stored"
					);
				})

				it('should fulfill a user claim', async () => {
					let user = newUser;
					UR.claimUser(user.id, {from: user.address});
					const {blockNumber, returnValues: {queryId: queryId}} = await waitForEvent(UR.Lodged);
					let claimString = await genClaimString(...claimArgs(user));

					let r = await TO.__callback(
						queryId,
						claimString,								// query result
						'0x0',	// proof
						{from: oraclize_cb}
					);

					logger.t(`Sending _fulfillClaim(${user.id})...`);
					//logger(UR._fulfillClaim(user.id, {from: user.address}))
					r = await UR._fulfillClaim(user.id, {from: user.address});
					logger.t(`_fulfillClaim(): ${r.receipt.gasUsed} gas used, cumulative: ${r.receipt.cumulativeGasUsed}`);
					//logger(UR._fulfillClaim(getwoketoke_id, {from: claimer}));
					//let claimed = (await waitForEvent(UR.Claimed)).returnValues;
					let claimed = (await UR.getPastEvents('Claimed', {from: blockNumber, to: 'latest'}))[0].args
					logger.e('event UserRegistry.Claimed:', claimed);

					assert.strictEqual(claimed.account, user.address);
					assert.strictEqual(claimed.userId, user.id);
					logger.t('Claimed amount: ', claimed.amount.toString());
					//assert.strictEqual(claimed.amount, '50');
					assert(await UR.getUserCount.call(), 1);
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
			//*/
		})
	})
})

// Replicate Helper.verifyClaimString
function signOrder(amount, nonce, callback) {
	var hash = "0x" + ethereumjs.ABI.soliditySHA3(
		["address", "uint256", "uint256"],
		[web3.eth.defaultAccount, amount, nonce]
	).toString("hex");
	web3.personal.sign(hash, web3.eth.defaultAccount, callback);
}

//web3.eth.sign(address, dataToSign, [, callback])
const sign = (address, dataToSign) => {
	return new Promise((resolve, reject) => {
		;
	});
}
