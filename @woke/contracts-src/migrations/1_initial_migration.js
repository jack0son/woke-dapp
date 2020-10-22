module.exports = function (deployer, network, accounts) {
	console.log('Using network: ', network);
	const [defaultAccount, owner, oracleCallback, ...rest] = accounts;
	console.log('Deploy account: ', defaultAccount);

	//deployer.deploy(artifacts.require('./Migrations.sol'), { from: defaultAccount });
};
