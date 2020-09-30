const { Logger, protocol } = require('@woke/lib');

function API(accounts, web3Instance, contractInstances, contractApi) {
	const contracts = contractInstances;
	const instance = web3Instance;

	function deployContracts() {}

	async function claimUser(user) {
		//console.log(Object.keys(contracts.UserRegistry.methods));
		////console.dir(contracts.UserRegistry.methods.claimUser);
		//let tx = await contracts.UserRegistry.methods.claimUser(user.id);
		////console.log(tx);
		let r = await contracts.UserRegistry.methods.claimUser(user.id).send({
			from: user.address,
		});

		let bn = r.receipt.blockNumber;
		let queryId = r.logs[r.logs.length - 1].args.queryId;
		logger.v('Claim queryId: ', queryId);
		const claimString = await genClaimString(...claimArgs(user));
		await TO.methods
			.__callback(queryId, claimString, '0x0')
			.send({ from: accounts.oraclize_cb });
		logger.name('claimUser()', `Sending _fulfillClaim( ${user.id} ) ...`);
		r = await contracts.UserRegistry.methods._fulfillClaim(user.id).send({
			from: user.address,
		});
		logger.name(
			'claimUser()',
			`_fulfillClaim(): ${r.receipt.gasUsed} gas used, cumulative: ${r.receipt.cumulativeGasUsed}`
		);
		let claimed = (
			await contracts.UserRegistry.getPastEvents('Claimed', { from: bn, to: 'latest' })
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
