const assert = require('assert');
const expect = require('chai').expect
const { web3 } = require('../src/actors');
const bootstrap = require('../src/actor-system');

const { delay } = require('../src/lib/utils');
const NETWORK_ID = 12;

const getId_okay = async () => {
		await delay(100);
		return NETWORK_ID;
}

const getId_wrong = async () => {
		await delay(100);
		return NETWORK_ID + 1;
}

const getId_fail = async () => {
		await delay(100);
		throw new Error('Connect not open on send()');
}

const Web3Instance = (getId) => {
	const web3 = {
		eth: {
			net: {
				getId,
			}
		}
	}
	return { web3, account, networkId };
}


// The focus of these tests is the flow communication flow within the web3 actor
// -- not the web3 tools
context('Web3Actor', function() {
	let director, a_web3;

	before(function () {
		director = bootstrap();
		a_web3 = director.start_actor('web3', web3);
	})

	describe('#get', function() {
		it('should get an existing instance', async function() {
			a_web3 = director.start_actor('web3', Web3(() => Web3Instance(getId_okay)));
			await query(a_web3, { type: 'init' })
			const web3Instance =  await query(a_web3, { type: 'get' });

			expect(Web3Instance).to.be.an.instanceOf(Web3Instance);
		})
	});
})
