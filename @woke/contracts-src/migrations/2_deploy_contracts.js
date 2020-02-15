//const oracle = artifacts.require("TwitterOracle.sol");
var OracleMock = artifacts.require("TwitterOracleMock.sol");
var Token = artifacts.require("WokeToken.sol");
var Strings = artifacts.require("Strings.sol");
var ECDSA = artifacts.require("ECDSA.sol");

const {blog, verbose, inspect} = require('../test/debug/common');

const doDeploy = async (deployer, network, accounts) => {
	const [defaultAccount, owner, oracleCallback, ...rest] = accounts;
	const maxSupply = 10000000;

	console.log('Using network: ', network);
	console.log('Deploy account: ', defaultAccount);
	console.log('Callback account: ', oracleCallback);

	const opts = {
		// gas: 500000000,
		from: defaultAccount,
		value: 100000, // 1 ETH
	};

	if(network == 'develop' || network == 'test' || network == 'client') {
		console.log('Callback account: ', oracleCallback);
		opts.value =  100000000000;
	}

	console.log('Deploying OracleMock...');
	await deployer.deploy(OracleMock, oracleCallback, opts);
	let oracleInstance = await OracleMock.deployed();
	console.log(`OracleMock deployed at ${oracleInstance.address}`);
	console.log('Deploying Strings...');
	await deployer.deploy(Strings);
	console.log('Deploying ECDSA...');
	await deployer.deploy(Strings);
	await deployer.deploy(ECDSA);
	await deployer.link(Strings, Token);
	await deployer.link(ECDSA, Token);
	console.log('Deploying WokeToken...')
	return await deployer.deploy(Token, oracleInstance.address, oracleInstance.address, maxSupply, opts)
		.then(tokenInsance => {
			console.log(`WokeToken deployed at ${tokenInsance.address}`);
			return tokenInsance;
		});
}

module.exports = function(deployer, network, accounts) {
	deployer.then(async () => {
		return await doDeploy(deployer, network, accounts);
	});
}
