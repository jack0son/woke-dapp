const {
	adapt,
	compose,
	ActorSystem: { block },
} = require('@woke/wact');
const {
	web3Tools: { methods },
} = require('@woke/lib/');
const { ParamError, TransactionError, OnChainError } = require('../lib/errors');

const TxActor = require('./tx');
const {
	makeContractInstanceFromConfig,
} = require('@woke/lib/web3-tools/instance-methods');

// TODO add contract tx actions to directory
const onCrash = (msg, error, ctx) => {
	if (msg.type == 'call') {
		// special cases for call
	}

	return TxActor.actions._methods.onCrash(msg, error, ctx);
};

let i = 0;
async function action_call(state, msg, ctx) {
	const { tx } = msg;
	const { method, args } = tx;
	const { callOpts, a_web3, contractConfig } = state;

	tx.type = 'call';
	const { web3Instance } = await block(a_web3, { type: 'get' });
	const opts = {
		...callOpts,
		...tx.opts,
	};

	// Contract instance should use web3 actor's instance
	const contract = makeContractInstanceFromConfig(web3Instance)(contractConfig);
	const result = await contract.methods[method](...tx.args).call(opts);

	//dispatch(ctx.sender, { type: 'tx', tx, result }, ctx.parent);
	ctx.receivers.sink({ tx, result, i: i++ }, ctx.parent);
	return ctx.stop;
}

// Build web3 tx object from the tx actor state
const getSendMethod = (
	{ tx, transactionSpec, contractConfig, contract },
	{ web3Instance }
) =>
	methods
		.makeContractInstanceFromConfig(web3Instance)(contractConfig)
		.methods[transactionSpec.method](...transactionSpec.args).send;

// @fix TODO: temporary work around
//	-- errors from web3 promi-event don't get caught by the actor when called
//	inside an async action without await
// @notice this action hands if it is made async
function action_send(state, _msg, ctx) {
	const { method, args, opts, ...msg } = _msg;
	const transactionSpec = { method, args, ...opts };

	return TxActor.actions.action_send(state, { transactionSpec, ...msg }, ctx);
}

const definition = {
	properties: {
		onCrash,
		initialState: {
			callOpts: {},
			sendOpts: {},
		},
	},

	actions: {
		action_call,
		//action_send,
	},
};

function ContractTx(a_web3, a_nonce, contractConfig) {
	// Contract instance has precedence

	return adapt(
		definition,
		compose(
			{ properties: { initialState: { contractConfig } } },
			TxActor.actions,
			TxActor.Properties(a_web3, a_nonce, getSendMethod)
		)
	);
}

module.exports = { ContractTx, definition };
