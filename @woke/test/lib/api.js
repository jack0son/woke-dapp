const { Logger, protocol } = require('@woke/lib');
const logger = Logger('woke:api');

// THE API IS NOT GETTING REFS TO NEW CONTRACTS
function API(adminAccounts, web3Instance, getContracts, contractApi, sendOpts) {
	const contracts = getContracts;
	const instance = web3Instance;

	const claimArgs = (u) => [u.address, u.id, u.followers_count];

	async function sendUserClaim(user) {
		let r = await contracts()
			.UserRegistry.methods.claimUser(user.id)
			.send({
				...sendOpts,
				from: user.address,
			});
		let queryId = r.events.Lodged.returnValues.queryId;
		//console.log(r.events.Lodged);
		logger.v('Claim queryId: ', queryId);
		return { queryId, r };
	}

	async function sendOracleResponse(user, queryId) {
		const claimString = await genClaimString(...claimArgs(user));
		const r = await contracts()
			.Oracle.methods.__callback(queryId, claimString, '0x0')
			.send({ ...sendOpts, from: adminAccounts.oraclize_cb });

		return { claimString, r };
	}

	function fulfillClaim(user) {
		logger.name('claimUser()', `Sending _fulfillClaim( ${user.id} ) ...`);
		return contracts()
			.UserRegistry.methods._fulfillClaim(user.id)
			.send({
				...sendOpts,
				from: user.address,
			});
	}

	async function claimUser(user) {
		// 1. Submit claim user
		const {
			queryId,
			r: { blockNumber },
		} = await sendUserClaim(user);
		logger.name('claimUser()', `Sending __callback( ${queryId} ) ...`);
		const claimString = await sendOracleResponse(user, queryId);
		const r = await fulfillClaim(user);

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

	async function genClaimString(signatory, userId, followersCount, app = 'twitter') {
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

	return { claimUser, genClaimString };
}

module.exports = API;
