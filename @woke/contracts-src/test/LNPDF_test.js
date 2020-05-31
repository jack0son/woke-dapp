const truffleAssert = require('truffle-assertions');
let {
	web3Tools,
} = require('@woke/lib');
const printEvents = truffleAssert.prettyPrintEmittedEvents;
const {fromAscii, toWei} = web3.utils;
const BN = require('bignumber.js');

const UserRegistry = artifacts.require('UserRegistry.sol')
const WokeToken = artifacts.require('WokeToken.sol')
const WokeFormula = artifacts.require('WokeFormula.sol')
const LogNormalPDF = artifacts.require('LogNormalPDF.sol')
const MockTwitterOracle = artifacts.require('mocks/TwitterOracleMock.sol')

const lndpfChunkedValues = require('../distribution/lnpdf-values.js');
const fillLnpdfArrays = require('../migrations/fill_lnpdf');
const lnpdfIntegers = require('../distribution/lnpdf-int_values.json');

contract('LogNormalPDF', (accounts) => {
	const [defaultAccount, owner, oraclize_cb, claimer, tipAgent, stranger, cB, cC, ...rest] = accounts;

	// Token Generation params
	let UR, WT, TO, WF, LNPDF;

	const x_maxDefined = 50e3;
	// TODO generate function values for logorthmically increasing x (100s of
	// thousands and millions of followers)

	describe('#lnpdf', () => {
		before('Deploy WokeToken', async function() {
			LNPDF = await LogNormalPDF.deployed();
		});

		beforeEach(async function () {
		});

		let edges = [0, 5e3, 10e3, 20e3, 30016, 39936, 49920];

		it('edge cases', async function () {
			for(let i = 0; i < edges.length ; i++) {
				let x = edges[i] - 1;
				x = x < 0 ? 0 : x;
				console.log(x);
				let y = await LNPDF.lnpdf(x);
				//let y = await LNPDF.lnpdf.call(x);
				console.log(`x: ${x.toString().padEnd(15)}, y: ${y}, expected ${lnpdfIntegers[x]}`);
				x += 1;
				console.log(x);
				y = await LNPDF.lnpdf(x);
				//y = await LNPDF.lnpdf.call(x);
				console.log(`x: ${x.toString().padEnd(15)}, y: ${y}, expected ${lnpdfIntegers[x]}`);
			}
		})

		it('all defined values', async function () {
			return;
			for(let i = 0; i < x_maxDefined; i++) {
				let y = await LNPDF.lnpdf.call(i);
				console.log(`x: ${i.toString().padEnd(15)}, y: ${y}`);
			}
		})

		it('outside of defined values', async function() {
		})
	});
})

