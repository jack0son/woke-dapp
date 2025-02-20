const { Logger, protocol, web3Tools } = require('@woke/lib');
const logger = Logger('woke:api');
const assert = require('assert');
const fs = require('fs');

// THE API IS NOT GETTING REFS TO NEW CONTRACTS
function API(adminAccounts, web3Instance, getContracts, contractApi, sendOpts) {
	const contracts = getContracts;
	const instance = web3Instance;

	const claimArgs = (u) => [u.address, u.id, u.followers_count];
	const estimateGas = web3Tools.utils.safeGasEstimate(instance.web3);

	async function sendEstimated(txObject, txOpts) {
		const opts = await estimateGas(txObject, txOpts);
		return txObject.send({ ...txOpts, ...opts });
	}

	function getUnclaimedBalance(user) {
		return contracts()
			.UserRegistry.methods.unclaimedBalanceOf(user.id)
			.call()
			.then(Number);
	}

	function getBalance(user) {
		return contracts().UserRegistry.methods.balanceOf(user.id).call().then(Number);
	}

	async function getUserBalance(user) {
		const balance = await getBalance(user);
		const unclaimedBalance = await getUnclaimedBalance(user);
		if (balance > 0)
			assert(unclaimedBalance == 0, 'claimed user should not have unclaimed tokens');
		if (unclaimedBalance > 0)
			assert(balance == 0, 'unclaimed user should not have claimed tokens');
		return balance + unclaimedBalance;
	}

	function userIsClaimed(user) {
		return contracts().UserRegistry.methods.userClaimed(user.id).call();
	}

	async function sendClaimUser(user) {
		logger.name('claimUser()', `Sending uid: ${user.id}`);
		let receipt = await contracts()
			.UserRegistry.methods.claimUser(user.id)
			.send({
				...sendOpts,
				from: user.address,
			});
		let queryId = receipt.events.Lodged.returnValues.queryId;
		//console.log(r.events.Lodged);
		logger.name('claimUser()', 'queryId: ', queryId);
		return { queryId, receipt };
	}

	async function sendOracleResponse(user, queryId) {
		const claimString = await buildOracleClaimString(...claimArgs(user));
		const r = await contracts()
			.Oracle.methods.__callback(queryId, claimString, '0x0')
			.send({ ...sendOpts, from: adminAccounts.oraclize_cb });

		return { claimString, r };
	}

	function sendFulfillClaim(user) {
		logger.name('_fulfillClaim()', `Sending( ${user.id} ) ...`);
		return contracts()
			.UserRegistry.methods._fulfillClaim(user.id)
			.send({
				...sendOpts,
				from: user.address,
			});
	}

	async function completeClaimUser(user) {
		// 1. Submit claim user
		const {
			queryId,
			receipt: { blockNumber },
		} = await sendClaimUser(user);
		logger.name('completeClaim()', `Sending __callback( ${queryId} ) ...`);
		const claimString = await sendOracleResponse(user, queryId);
		const r = await sendFulfillClaim(user);

		logger.name(
			'completeClaim()',
			`_fulfillClaim(): ${r.gasUsed} gas used, cumulative: ${r.cumulativeGasUsed}`
		);
		let claimed = (
			await contracts().UserRegistry.getPastEvents('Claimed', {
				from: blockNumber,
				to: 'latest',
			})
		)[0].returnValues;
		logger.name(
			'completeClaim()',
			`Claimed: ${claimed.amount} WOKE, Bonus: ${claimed.bonus} WOKE`
		);
		return { claimed, receipt: r.receipt };
	}

	function assign() {}

	function transferClaimed(from, to, amount) {
		return contracts()
			.UserRegistry.methods.transferClaimed(to.id, amount)
			.send({ from: from.address });
	}

	function transferUnclaimed(from, to, amount) {
		return sendEstimated(
			contracts().UserRegistry.methods.transferUnclaimed(to.id, amount),
			{ from: from.address }
		);
		// .send({ from: from.address });
	}

	async function transfer(from, to, amount) {
		const args = [from, to, amount];
		return (await userIsClaimed(to))
			? transferClaimed(...args)
			: transferUnclaimed(...args);
	}

	function userClaimString(user) {
		return buildUserClaimString(...claimArgs(user));
	}

	async function buildOracleClaimString(
		signatory,
		userId,
		followersCount,
		app = 'twitter'
	) {
		//logger.v('Gen claim for: ', signatory, userId, followersCount);
		let str = await protocol.buildOracleClaimString(instance.web3)(
			signatory,
			userId,
			followersCount,
			app
		);
		//logger.v(`Oracle claim string: ${str}`);
		return str;
	}

	async function buildUserClaimString(
		signatory,
		userId,
		followersCount,
		app = 'twitter'
	) {
		//logger.v('Gen claim for: ', signatory, userId, followersCount);
		let str = await protocol.buildUserClaimString(instance.web3)(
			signatory,
			userId,
			followersCount,
			app
		);
		//logger.v(`Oracle claim string: ${str}`);
		return str;
	}

	return {
		sendEstimated,
		sendClaimUser,
		sendOracleResponse,
		sendFulfillClaim,
		completeClaimUser,
		getUserBalance,
		userIsClaimed,
		userClaimString,
		buildUserClaimString,
		buildOracleClaimString,
		transfer,
		transferUnclaimed,
		transferClaimed,
	};
}

module.exports = API;
