const { waitForEvent, genRandomUserId } = require('./utils');
const truffleAssert = require('truffle-assertions');
const printEvents = truffleAssert.prettyPrintEmittedEvents;
const {fromAscii, toWei, fromWei} = web3.utils;
const BN = require('bignumber.js');
const {
	//web3Tools,
	Logger,
} = require('@woke/lib');
logger = Logger('test:UR');

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
const config = { WokeFormula: wokeFormulaConfig };
contract('UserRegistry, WokeToken, Distribution', (accounts) => {
	let UR, WT, TO, WF, LNDPF;
	const [defaultAccount, owner, oraclize_cb, claimer, tipAgent, stranger, cA, cB, cC, cD, ...rest] = accounts;
	let { claimArgs, genClaimString, claimUser, joinWithTributes} = bindHarness(
		accounts,
		{ UR, WT, TO, WF, LNDPF },
		config
	);
	let ctx;

	let newUser = {address: cA, id: '212312122', handle: 'jack', followers: 30000};

	before('Get deployed contract instances', async function() {
		WF = await WokeFormula.deployed();
		WT = await WokeToken.deployed();
		LNPDF = await LogNormalPDF.deployed();
	})

	beforeEach('Deploy fresh contracts instances', async function() {
		//logger.t('ctx1:beforeEach');
		TO = await MockTwitterOracle.new(oraclize_cb,
			{from: defaultAccount, value: web3.utils.toWei('0.01', 'ether')}
		);

		WT = await WokeToken.new(WF.address, wokeFormulaConfig.maxSupply, {from: defaultAccount});
		UR = await UserRegistry.new(WT.address, LNPDF.address, TO.address, tipAgent, wokeFormulaConfig.maxTributors, {from: defaultAccount})
		await WT.setUserRegistry(UR.address, {from: defaultAccount});
		ctx = bindHarness(accounts, { UR, WT, TO, WF, LNDPF }, wokeFormulaConfig);
	})

	describe('Users at scale', () => {
	})

	describe('Tributors at scale', () => {

		let tributorsSample = tributorData.symmetric.slice(0, rest.length);
		it(`should not revert when exceeding maximum number of tributors (using ${tributorsSample.length})`, async function() {
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
			await ctx.joinWithTributes(newUser, tributors);
		});
	})
})
