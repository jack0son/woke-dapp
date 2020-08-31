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

	describe('#send', function () {
		// @TODO
		it('should respond with transaction pending', async function () {
			const res = await query(a_txSystem, { type: 'send', opts: {} }, TIME_TIMEOUT);

			res.should.have.property('status');
			res.status.should.deep.equal('pending');
			return res.should.have.deep.property('status', 'pending');
		});

		it('should respond with sink status updates [.... STATUSES ? ]', async function () {
			const deferred = new Deferral();

			function myHandler(state, msg, ctx) {
				msg.action.should.equal('send');
				const { txState } = state;
				const { tx, error, status } = msg;

				error.should.not.exist;
				tx.should.exist;
				tx.should.not.exist;

				if (!txState) {
					msg.status.should.equal('pending');
				} else {
					switch (txState.tx.status) {
						case 'pending':
							status.should.equal('complete');
							deferred.promise.resolve();
							break;
						case 'success':
							throw new Error(`Completed tx should be stopped`);
							break;
						default:
							throw new Error(`Unspecified tx status ${txState.tx.status}`);
					}
				}

				return { ...state, txState: { tx, error, status } };
			}

			setTxHandler(myHandler);

			const sendTxMsg = { type: 'send', opts: {} };
			console.log('txHandler', await block(a_caller, { type: 'getTxHandler' }));
			const res = await query(
				a_caller,
				{ type: 'forward', to: a_txSystem, msg: sendTxMsg },
				TIME_TIMEOUT
			);
			await deferred.promise;
		});

		it('should support multiple addresses', async function () {});

		it('should support options x, y, z', async function () {});
	});

	describe('#interface errors', function () {
		it('should report nonce error', function () {});
		it('should report insufficient funds / out of gas error', function () {});
	});
});
