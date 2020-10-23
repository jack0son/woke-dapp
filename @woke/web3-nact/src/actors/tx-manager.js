const {
	ActorSystem,
	receivers: { sink },
} = require('@woke/wact');
const { start_actor, dispatch, block } = ActorSystem;
const j0 = require('@woke/jack0son');
//const { useNotifyOnCrash } = require('@woke/actors');

const { useNotifyOnCrash } = require('@woke/actors');
const { initContract } = require('@woke/lib').web3Tools.utils;

const Web3Tx = require('./web3-tx');

// Rename to tx-supervisor
let tx_idx = 0;
const spawn_tx = ({ state, ctx, msg }) => (_opts) => {
	const { importantOnly, ...opts } = _opts;
	j0.exists(opts.nonce) &&
		ctx.debug.warn(msg, `Overriding nonce manager with nonce = ${opts.nonce}`);

	const a_tx = start_actor(ctx.self)(
		`_tx-${tx_idx++}`,
		Web3Tx(state.a_web3, state.a_nonce),
		{
			[!!importantOnly ? 'importantSinks' : 'sinks']: [ctx.sender], // forward the sender to this tx
		}
	);

	dispatch(a_tx, { type: 'send', transactionSpec: opts }, ctx.sender);
	return a_tx;
};

function action_send(state, msg, ctx) {
	const { opts } = msg;
	ctx.receivers.spawn_tx(opts); // parent is me
}

function action_getCore(state, msg, ctx) {
	const { a_web3, a_nonce } = state;
	dispatch(ctx.sender, { a_web3, a_nonce }, ctx.self);
}

const TxManager = ({ a_web3, a_nonce }) => ({
	properties: {
		initialState: {
			a_nonce,
			a_web3,
		},
		onCrash: useNotifyOnCrash(),
		receivers: [spawn_tx],
	},
	actions: {
		send: action_send,
		get_core: action_getCore,
	},
});

module.exports = TxManager;
