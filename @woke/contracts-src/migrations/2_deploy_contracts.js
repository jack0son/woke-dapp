//const oracle = artifacts.require("TwitterOracle.sol");
var OracleMock = artifacts.require("TwitterOracleMock.sol");
var WokeFormula = artifacts.require("WokeFormula");
var UserRegistry = artifacts.require("UserRegistry.sol");
var Token = artifacts.require("WokeToken.sol");
var Distribution = artifacts.require("Distribution.sol");
var Structs = artifacts.require("Helpers.sol");
var Helpers = artifacts.require("Helpers.sol");
var Strings = artifacts.require("Strings.sol");
var ECDSA = artifacts.require("ECDSA.sol");
var Curves = artifacts.require("Curves.sol");

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

	console.log('Deploying Structs...');
	await deployer.deploy(Structs);
	await deployer.link(Structs, WokeFormula);
	await deployer.link(Structs, UserRegistry);

	console.log('Deploying Strings...');
	await deployer.deploy(Strings);
	await deployer.link(Strings, Helpers);

	console.log('Deploying ECDSA...');
	await deployer.deploy(ECDSA);
	await deployer.link(ECDSA, Helpers);

	console.log('Deploying Curves...');
	await deployer.deploy(Curves);
	await deployer.link(Curves, Distribution);

	console.log('Deploying Helpers...');
	await deployer.deploy(Helpers);
	await deployer.link(Helpers, Token);

	console.log('Deploying Distribution...');
	await deployer.deploy(Distribution);
	await deployer.link(Distribution, Token);

	const curveParams = {
		maxPrice: 210,						// a/2
		inflectionSupply: 2.72e6, // b
		steepness: 1.4e9,					// c
	};

	opts.value = 0;
	console.log('Deploying WokeFormula...');
	await deployer.deploy(WokeFormula,
		curveParams.maxPrice,
		curveParams.inflectionSupply,
		curveParams.steepness,
		opts,
	);
	let formulaInstance = await WokeFormula.deployed();
	console.log(`WokeFormula deployed at ${formulaInstance.address}`);

	console.log('Deploying WokeToken...')
	await deployer.deploy(Token, formulaInstance.address, maxSupply, opts)
	let tokenInstance = await Token.deployed();
	console.log(`WokeToken deployed at ${tokenInstance.address}`);

	console.log('Deploying UserRegistry...')
	return await deployer.deploy(UserRegistry, tokenInstance.address, oracleInstance.address, owner, opts)
		.then(async registryInstance => {
			tokenInstance.setUserRegistry(registryInstance.address, opts);
			console.log(`UserRegistry deployed at ${registryInstance.address}`);
			return registryInstance;
		});
}

module.exports = function(deployer, network, accounts) {
	deployer.then(async () => {
		return await doDeploy(deployer, network, accounts);
	});
}
