const truffleAssert = require('truffle-assertions');
let {
	web3Tools,
	Logger,
} = require('@woke/lib');
const printEvents = truffleAssert.prettyPrintEmittedEvents;
const BN = require('bignumber.js');

const LogNormalPDF = artifacts.require('LogNormalPDF.sol')

const lndpfChunkedValues = require('../distribution/lnpdf-values.js');
const fillLnpdfArrays = require('../migrations/fill_lnpdf');
const lnpdfIntegers = require('../distribution/lnpdf-int_values.json');

const logger = Logger('test:LNPDF');

contract('LogNormalPDF', (accounts) => {
	//const [defaultAccount, owner, oraclize_cb, claimer, tipAgent, stranger, cB, cC, ...rest] = accounts;

	// Token Generation params
	let LNPDF;

	const x_maxDefined = 50e3;
	// TODO generate function values for logorthmically increasing x (100s of
	// thousands and millions of followers)

	describe('#lnpdf', () => {
		before('Deploy WokeToken', async function() {
			LNPDF = await LogNormalPDF.deployed();
		});

		beforeEach(async function () {
		});

		// Generate using log-normal-pdf.py
		let edges = [0, 5e3, 10e3, 20e3, 30016, 39936, 49920];

		it('edge cases', async function () {
			for(let i = 0; i < edges.length ; i++) {
				let x = edges[i] - 1;
				x = x < 0 ? 0 : x;
				logger.info(x);
				let y = await LNPDF.lnpdf(x);
				//let y = await LNPDF.lnpdf.call(x);
				logger.info(`x: ${x.toString().padEnd(15)}, y: ${y}, expected ${lnpdfIntegers[x]}`);
				x += 1;
				logger.info(x);
				y = await LNPDF.lnpdf(x);
				//y = await LNPDF.lnpdf.call(x);
				logger.info(`x: ${x.toString().padEnd(15)}, y: ${y}, expected ${lnpdfIntegers[x]}`);
			}
		})

		it('all defined values', async function () {
			return;
			for(let i = 0; i < x_maxDefined; i++) {
				let y = await LNPDF.lnpdf.call(i);
				logger.info(`x: ${i.toString().padEnd(15)}, y: ${y}`);
			}
		})

		it('outside of defined values', async function() {
		})
	});
})

