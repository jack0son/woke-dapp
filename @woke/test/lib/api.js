const { Logger, protocol } = require('@woke/lib');
const logger = Logger('woke:api');

// THE API IS NOT GETTING REFS TO NEW CONTRACTS
function API(adminAccounts, web3Instance, getContracts, contractApi, sendOpts) {
	const contracts = getContracts;
	const instance = web3Instance;

	const claimArgs = (u) => [u.address, u.id, u.followers_count];

	function getUserBalance(user) {
		return contracts().UserRegistry.methods.balanceOf(e.returnValues.userId).call();
	}

	function userIsClaimed(user) {
		return contracts().UserRegistry.methods.userClaimed(user.id).call();
	}

	async function sendClaimUser(user) {
		let receipt = await contracts()
			.UserRegistry.methods.claimUser(user.id)
			.send({
				...sendOpts,
				from: user.address,
			});
		let queryId = receipt.events.Lodged.returnValues.queryId;
		//console.log(r.events.Lodged);
		logger.v('Claim queryId: ', queryId);
		return { queryId, receipt };
	}

	async function sendOracleResponse(user, queryId) {
		const claimString = await buildClaimString(...claimArgs(user));
		const r = await contracts()
			.Oracle.methods.__callback(queryId, claimString, '0x0')
			.send({ ...sendOpts, from: adminAccounts.oraclize_cb });

		return { claimString, r };
	}

	function sendFulfillClaim(user) {
		logger.name('claimUser()', `Sending _fulfillClaim( ${user.id} ) ...`);
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
			r: { blockNumber },
		} = await sendClaimUser(user);
		logger.name('claimUser()', `Sending __callback( ${queryId} ) ...`);
		const claimString = await sendOracleResponse(user, queryId);
		const r = await sendFulfillClaim(user);

		logger.name(
			'claimUser()',
			`_fulfillClaim(): ${r.gasUsed} gas used, cumulative: ${r.cumulativeGasUsed}`
		);
		let claimed = (
			await contracts().UserRegistry.getPastEvents('Claimed', {
				from: blockNumber,
				to: 'latest',
			})
		)[0].returnValues;
		logger.name(
			'claimUser()',
			`Claimed: ${claimed.amount} WOKE, Bonus: ${claimed.bonus} WOKE`
		);
		return { claimed, receipt: r.receipt };
	}

	function assign() {}

	function transfer(from, to) {}

	function userClaimString(user) {
		return buildClaimString(...claimArgs(user));
	}

	async function buildClaimString(signatory, userId, followersCount, app = 'twitter') {
		//logger.v('Gen claim for: ', signatory, userId, followersCount);
		let str = await protocol.genClaimString(instance.web3)(
			signatory,
			userId,
			followersCount,
			app
		);
		//logger.v(`Oracle claim string: ${str}`);
		return str;
	}

	return {
		sendClaimUser,
		completeClaimUser,
		buildClaimString,
		getUserBalance,
		userIsClaimed,
		buildClaimString,
		userClaimString,
	};
}

module.exports = API;
