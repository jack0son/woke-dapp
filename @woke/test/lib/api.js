const { Logger, protocol } = require('@woke/lib');
const logger = Logger('woke:api');

// THE API IS NOT GETTING REFS TO NEW CONTRACTS
function API(accounts, web3Instance, contractInstances, contractApi, sendOpts) {
	const contracts = contractInstances;
	const instance = web3Instance;

	if (accounts.length < 4) throw new Error('Woke API requires at least 4 accounts');
	const [defaultAccount, owner, oraclize_cb, tipAgent, ...otherAccounts] = accounts;
	const claimArgs = (u) => [u.address, u.id, u.followers];

	function deployContracts() {}

	async function sendUserClaim(user) {
		let r = await contracts.UserRegistry.methods.claimUser(user.id).send({
			...sendOpts,
			from: user.address,
		});
		let queryId = r.events.Lodged.returnValues.queryId;
		logger.v('Claim queryId: ', queryId);
		return { queryId, r };
	}

	async function sendOracleResponse(user, queryId) {
		const claimString = await genClaimString(...claimArgs(user));
		const r = await contracts.Oracle.methods
			.__callback(queryId, claimString, '0x0')
			.send({ ...sendOpts, from: oraclize_cb });
		logger.name('claimUser()', `Sending _fulfillClaim( ${user.id} ) ...`);

		return { claimString, r };
	}

	function fulfillClaim(user) {
		return contracts.UserRegistry.methods._fulfillClaim(user.id).send({
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
		const claimString = await sendOracleResponse(user, queryId);
		const r = await fulfillClaim(user);

		logger.name(
			'claimUser()',
			`_fulfillClaim(): ${r.receipt.gasUsed} gas used, cumulative: ${r.receipt.cumulativeGasUsed}`
		);
		let claimed = (
			await contracts.UserRegistry.getPastEvents('Claimed', {
				from: blockNumber,
				to: 'latest',
			})
		)[0].args;
		logger.name(
			'claimUser()',
			`Claimed: ${claimed.amount.toString()} WOKE, Bonus: ${claimed.bonus.toString()} WOKE`
		);
		return { claimed, receipt: r.receipt };
	}

	function assign() {}

	function transfer(from, to) {}

	async function genClaimString(signatory, userId, followersCount, app = 'twitter') {
		logger.v('Gen claim for: ', signatory, userId, followersCount);
		let str = await protocol.genClaimString(instance.web3)(
			signatory,
			userId,
			followersCount,
			app
		);
		logger.v(`Oracle claim string: ${str}`);
		return str;
	}

	return { claimUser, genClaimString };
}

module.exports = API;
