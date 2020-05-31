const { Logger, protocol } = require('@woke/lib');
logger = Logger('UR');

// TODO param test context
// Pass in truffle test context
// @param accounts
// @param contractInstances
// @param config
module.exports = (accounts, {UR, WT, TO, WF, LNDPF}, wokeFormulaConfig) => {
	const [defaultAccount, owner, oraclize_cb, claimer, tipAgent, stranger, cA, cB, cC, cD, ...rest] = accounts;
	const	claimArgs = u => [u.address, u.id, u.followers];

	async function genClaimString(signatory, userId, followersCount, app = 'twitter') {
		logger.v('Gen claim for: ', signatory, userId, followersCount);
		let str = await protocol.genClaimString(signatory, userId, followersCount, app)
		logger.v(`Oracle claim string: ${str}`);
		return str;
	}

	// @param userObject: address, id, followersCount
	const bindClaimUser = (UR, TO, oracleAddress) => async (userObject) => {
		//async function claimUser(userObject) {
		let r = await UR.claimUser(userObject.id, {from: userObject.address});
		let bn = r.receipt.blockNumber;
		let queryId = r.logs[r.logs.length-1].args.queryId;
		logger.v('Claim queryId: ', queryId);
		const claimString = await genClaimString(...claimArgs(userObject));
		await TO.__callback(queryId, claimString, '0x0', {from: oracleAddress});
		logger.name('claimUser()', `Sending _fulfillClaim( ${userObject.id} ) ...`);
		r = await UR._fulfillClaim(userObject.id, {from: userObject.address});
		logger.name('claimUser()', `_fulfillClaim(): ${r.receipt.gasUsed} gas used, cumulative: ${r.receipt.cumulativeGasUsed}`);
		let claimed = (await UR.getPastEvents('Claimed', {from: bn, to: 'latest'}))[0].args
		logger.name('claimUser()', `Claimed: ${claimed.amount.toString()} WOKE, Bonus: ${claimed.bonus.toString()} WOKE`);
		return { claimed, receipt: r.receipt };
	}

	// @TODO this is ugly
	function bindJoinWithTributes(claimUser) { 
		return async (newUser, tributors) => {
			logger.t(`User joining with ${tributors.length} tributors...`);
			bindClaimUser(UR, TO, oraclize_cb);
			// 1. Claim all tributors
			for(t of tributors) {
				let r = await claimUser(t);
				t.summoned = (await WT.getPastEvents('Summoned', {from: r.receipt.blockNumber, to: 'latest'}))[0].args.amount;
				t.supply = await WT.totalSupply.call();
				t.pool = await UR.noTributePool.call()
				t.circulation = t.supply - t.pool;
				t.fb = await WT.followerBalance.call()
			}

			// 2. Transfer tributes
			let tributeTotal = 0;
			for(t of tributors) {
				const balance = await WT.balanceOf.call(t.address);
				t.rof = (balance/t.followers).toFixed(8);
				if(t.amount > balance) t.amount = balance;  // avoid reverts
				if(t.amount > 0)
					await UR.transferUnclaimed(newUser.id, t.amount, {from: t.address});
				t.balance = await WT.balanceOf.call(t.address);
				let supplyStr = `${t.summoned.toString().padStart(16)}, ${t.supply.toString().padStart(16)} ${t.circulation.toString().padStart(16)}${t.pool.toString().padStart(16)}`;
				logger.info(`${tributors.indexOf(t).toString().padStart(4)}:${t.id.padEnd(15)} fol: ${t.followers.toString().padStart(10)} bal: ${balance.toString().padStart(9)} ${t.rof.padStart(12)} fb: ${t.fb.toString().padStart(10)}` + supplyStr);
				tributeTotal += t.amount;
			}

			// 3. User joins
			let r = await claimUser(newUser)
			// 4. check user bonuses
			let summoned = (await WT.getPastEvents('Summoned', {from: r.receipt.blockNumber, to: 'latest'}))[0].args
			const tributePool = summoned.amount.toNumber() - r.claimed.bonus.toNumber()
			logger.e(`Minted: ${summoned.amount.toNumber()} Tribute pool: ${tributePool}`);
			//assert.equal((await WT.balanceOf.call(newUser.address)).toNumber(), r.claimed.bonus.toNumber() + tributeTotal);

			// 5. check tributor bonuses
			let bonusTotal = 0;
			for(t of tributors) {
				let newBalance = await WT.balanceOf.call(t.address);
				t.bonus = newBalance.toNumber() - t.balance.toNumber();
				bonusTotal += t.bonus;
				logger.info(`${tributors.indexOf(t).toString().padStart(4)}:${t.id.padEnd(15)} fol: ${t.followers.toString().padEnd(15)} bonus: ${t.bonus}`);
				if(tributors.indexOf(t) >= wokeFormulaConfig.maxTributors) {
					assert.equal(t.bonus, 0, 'Tributors above maxTributors receive no bonus');
				}
			}
			logger.t(`_fulfillClaim() used ${r.receipt.gasUsed} gas`);
			logger.t(`Tribute pool: ${tributePool}, Bonuses distributed: ${bonusTotal}, diff = ${tributePool - bonusTotal}`);
			assert.equal(tributePool, bonusTotal, 'Tribute bonuses equal to tribute bonus pool');
		}
	}

	return {
		claimArgs,
		genClaimString,
		bindClaimUser,
		bindJoinWithTributes,
	}
}

