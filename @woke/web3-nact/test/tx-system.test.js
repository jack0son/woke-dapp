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
			const res = await query(a_txSystem, { type: 'send', opts: {} }, TIME_TIMEOUT);

			res.should.have.property('status');
			res.status.should.deep.equal('pending');
			return res.should.have.deep.property('status', 'pending');
		});

		it('should respond with transaction complete', async function () {
			const deferred = new Deferral();

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

		it('should report message parameter error', async function () {});

		it('should support multiple addresses', async function () {});

		it('should support options x, y, z', async function () {});
	});

	// @TODO create test mock contract that will cause deterministic errors
	describe('#interface errors', function () {
		it('should report if no to address is provided', function () {});
		it('should report nonce error', function () {});
		it('should report insufficient funds / out of gas error', function () {});
	});
});
