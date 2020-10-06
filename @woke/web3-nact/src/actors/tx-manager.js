const {
	ActorSystem,
	receivers: { sink },
} = require('@woke/wact');
const { start_actor, dispatch, block } = ActorSystem;
//const { useNotifyOnCrash } = require('@woke/actors');

const { useNotifyOnCrash } = require('@woke/actors');
const { initContract } = require('@woke/lib').web3Tools.utils;

const Web3Tx = require('./web3-tx');

let tx_idx = 0;
function spawn_tx(state, ctx) {
	return start_actor(ctx.self)(`_tx-${tx_idx++}`, Web3Tx(state.a_web3, state.a_nonce), {
		sinks: [ctx.sender], // forward the sender to this tx
	});
}

function action_send(state, msg, ctx) {
	const { opts } = msg;
	const a_tx = spawn_tx(state, ctx); // parent is me
	const _msg = { type: 'send', transactionSpec: opts };
	dispatch(a_tx, _msg, ctx.sender);
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
	},
	actions: {
		send: action_send,
		get_core: action_getCore,
	},
});

module.exports = TxManager;
