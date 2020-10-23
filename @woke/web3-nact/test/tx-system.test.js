const should = require('chai').use(require('chai-as-promised')).should();

const { ActorSystem, adapters, Deferral } = require('@woke/wact');
const { bootstrap, query, block, dispatch } = ActorSystem;
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
			txState: undefined,
			sinkHandlers: {
				tx: handleTxResponse,
			},
		},
	},

	actions: {
		...adapters.SinkReduce(),
		forward: (_, msg, ctx) => dispatch(msg.to, msg.msg, msg.from || ctx.self),
		setTxHandler: (state, msg) => ({
			...state,
			sinkHandlers: { tx: msg.txHandler },
		}),
		getTxHandler: (state, msg, ctx) => dispatch(ctx.sender, state.sinkHandlers, ctx.self),
	},
};

const createSetTxHandler = (a_caller) => (txHandler) =>
	dispatch(a_caller, { type: 'setTxHandler', txHandler });

context('TxSystem', function () {
	let director, a_txSystem, a_caller;
	let setTxHandler;

	//const web3Instance_example = Web3Mock(getId_okay)

	beforeEach(function () {
		director = bootstrap();
		a_txSystem = TxSystem(director);
		a_caller = director.start_actor('caller', callerStubDefinition);
		setTxHandler = createSetTxHandler(a_caller);
	});

	afterEach(function () {
		director.stop();
	});

	describe('#send - Tx.actions', function () {
		// @TODO
		it('should respond with transaction pending', async function () {
			const rx = await query(a_txSystem, { type: 'send', opts: {} }, TIME_TIMEOUT);

			rx.should.have.property('status');
			rx.status.should.deep.equal('pending');
			return rx.should.have.deep.property('status', 'pending');
		});

		it('should not notify intermediate states if requested', async function () {
			// @TODO fix, called 'important states' for now (error, success)
			const rx = await query(
				a_txSystem,
				{ type: 'send', opts: { importantOnly: true } },
				TIME_TIMEOUT
			);

			rx.should.have.property('status');
			rx.status.should.deep.equal('success');
			return rx.should.have.deep.property('status', 'success');
		});

		it('should respond with transaction complete', async function () {
			const deferred = new Deferral();

			// Set tx handler in the mock tx caller
			setTxHandler((state, msg, ctx) => {
				msg.action.should.equal('send');
				const { txState } = state;
				const { tx, error, status } = msg;

				tx.should.exist;
				should.not.exist(error);

				//console.log('status', status);
				//console.log('txState', txState);
				const nextState = { ...state, txState: { tx, error, status } };

				if (!txState) {
					msg.status.should.equal('pending');
				} else {
					switch (txState.status) {
						case 'pending':
							status.should.equal('success');
							deferred.resolve('resolved');
							break;
						case 'success':
							throw new Error(`Completed tx should be stopped`);
							break;
						default:
							throw new Error(`Unspecified tx status ${txState.status}`);
					}
				}

				return nextState;
			});

			const sendTxMsg = { type: 'send', opts: {} };
			dispatch(
				a_caller,
				{ type: 'forward', to: a_txSystem, msg: sendTxMsg },
				TIME_TIMEOUT
			);
			await deferred.promise;
		});

		it('should report message parameter error', async function () {
			this.skip();
		});

		it('should support multiple addresses', async function () {
			this.skip();
		});

		it('should support options x, y, z', async function () {
			this.skip();
		});
	});

	describe('nonce errors', function () {
		it('should retry on failed nonce', async function () {
			// 1. do a tx to  ensure correct nonce > 0
			const rx1 = await query(
				a_txSystem,
				{ type: 'send', opts: { importantOnly: true } },
				TIME_TIMEOUT
			);
			rx1.should.have.deep.property('status', 'success');
			// 2. set nonce to 0
			// 3. Attempt tx
			const rx2 = await query(
				a_txSystem,
				{ type: 'send', opts: { importantOnly: true, nonce: 0 } },
				TIME_TIMEOUT
			);
			rx2.should.have.deep.property('status', 'success');
		});
	});

	// @TODO create test mock contract that will cause deterministic errors
	describe('#interface errors', function () {
		it('should report if no to address is provided', function () {
			this.skip();
		});
		it('should report nonce error', function () {
			this.skip();
		});
		it('should report insufficient funds / out of gas error', function () {
			this.skip();
		});
	});
});
