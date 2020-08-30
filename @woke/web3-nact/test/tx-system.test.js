const assert = require('assert');
const expect = require('chai').use(require('chai-as-promised')).expect;

const { ActorSystem } = require('@woke/wact');
const { query, dispatch, bootstrap } = ActorSystem;
const TxSystem = require('../src/systems/tx');

const TIME_OKAY = 10;
const TIME_LONG = 100;
const TIME_TIMEOUT = 500;

context('TxSystem', function () {
	let director, a_txSystem;

	//const web3Instance_example = Web3Mock(getId_okay)

	beforeEach(function () {
		director = bootstrap();
		a_txSystem = TxSystem(director);
	});

	afterEach(async function () {
		await director.stop();
		return;
	});

	describe('#send', function () {
		it('should send a transaction', async function () {
			const res = await query(a_txSystem, { type: 'send', opts: {} }, TIME_TIMEOUT);

			expect(res).to.have.property('txStatus');
			return expect(res.txStatus).to.equal('pending');
		});
		it('should support multiple addresses', function () {});
	});

	describe('#interface errors', function () {
		it('should report nonce error', function () {});
		it('should report insufficient funds / out of gas error', function () {});
	});
});
