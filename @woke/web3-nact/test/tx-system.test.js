const assert = require('assert');
const expect = require('chai').use(require('chai-as-promised')).expect;

const { ActorSystem, adapters } = require('@woke/wact');
const { query, dispatch, bootstrap } = ActorSystem;
const TxSystem = require('../src/systems/tx');
const { delay } = require('../src/lib/utils');

const TIME_OKAY = 10;
const TIME_LONG = 100;
const TIME_TIMEOUT = 5000;

function handleTxResponse(state, msg, ctx) {
	console.log(msg);
}

const callerStubDefinition = {
	properties: {
		initialState: {
			sinkHandlers: {
				tx: handleTxResponse,
			},
		},
	},

	actions: {
		...adapters.SinkReduce(),
		forward: (_, msg, ctx) => dispatch(msg.to, msg.msg, msg.from || ctx.self),
		setTxHandler: (state, msg, ctx) => {
			return { ...state, sinkHandlers: { tx: msg.txHandler } };
		},
	},
};

context('TxSystem', function () {
	let director, a_txSystem, a_caller;

	//const web3Instance_example = Web3Mock(getId_okay)

	beforeEach(function () {
		director = bootstrap();
		a_txSystem = TxSystem(director);
		a_caller = director.start_actor('caller', callerStubDefinition);
	});

	afterEach(async function () {
		await director.stop();
		return;
	});

	describe('#send', function () {
		// @TODO
		it('should respond with transaction pending', async function () {
			const res = await query(a_txSystem, { type: 'send', opts: {} }, TIME_TIMEOUT);

			expect(res).to.have.property('txStatus');
			return expect(res.txStatus).to.equal('pending');
		});

		it('should respond with sink status updates [.... STATUSES ? ]', async function () {
			const sendTxMsg = { type: 'send', opts: {} };
			const res = await query(
				a_caller,
				{ type: 'forward', to: a_txSystem, msg: sendTxMsg },
				TIME_TIMEOUT
			);
			return delay(TIME_TIMEOUT);
		});

		it('should support multiple addresses', async function () {});

		it('should support options x, y, z', async function () {});
	});

	describe('#interface errors', function () {
		it('should report nonce error', function () {});
		it('should report insufficient funds / out of gas error', function () {});
	});
});
