const {
	ActorSystem,
	receivers: { sink },
} = require('@woke/wact');
const { start_actor, dispatch, block } = ActorSystem;
//const { useNotifyOnCrash } = require('@woke/actors');

const { useNotifyOnCrash } = require('@woke/actors');
const { initContract } = require('@woke/lib').web3Tools.utils;

const Web3Tx = require('./web3-tx');

// Rename to tx-supervisor
let tx_idx = 0;
const spawn_tx = ({ state, ctx }) => (opts) => {
	return start_actor(ctx.self)(`_tx-${tx_idx++}`, Web3Tx(state.a_web3, state.a_nonce), {
		[!!opts.importantOnly ? 'importantSinks' : 'sinks']: [ctx.sender], // forward the sender to this tx
	});
};

function action_send(state, msg, ctx) {
	const { opts } = msg;
	const a_tx = ctx.receivers.spawn_tx(opts); // parent is me
	dispatch(a_tx, { type: 'send', transactionSpec: opts }, ctx.sender);
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
