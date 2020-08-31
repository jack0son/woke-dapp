const {
	ActorSystem: { dispatch, block, stop },
	action,
} = require('@woke/wact');
const {
	web3Tools: { utils },
} = require('@woke/lib');
const { maxAttempts: MAX_ATTEMPTS } = require('./config');
const errors = require('../../lib/errors');

// 1. send (preflight): receive and validate transaction parameters and queue send
// 2. publish: send tx to web3 provider and setup listeners
// 3. reduce: reduce transaction state from listeners and peform effects:
//	- notify tx sinks
//	- throw errors

function resolveStatus(txState) {
	if (txState.error) {
		return 'error';
	} else if (txState.receipt) {
		return 'success';
	} else if (txState.hash) {
		return 'pending';
	} else {
		return 'init';
	}
}

// Errors that callers should receive details of
function isServiceInterfaceError(error) {
	// @TODO define service interface errors
	return error instanceof errors.RevertError || false;
}

function isServiceFailureError(error) {
	// @TODO define service failure errors
	return error instanceof errors.ProviderError;
}

const actions = { action_send, action_publish, action_reduceTxEvent, action_notifySinks };
const directory = action.buildDirectory(actions);

function onCrash(msg, error, ctx) {
	if (isServiceFailureError(error)) {
		return ctx.escalate; // a_contract or a_txManager will perform failure reporting
	}

	switch (msg.type) {
		case directory.address(action_reduceTxEvent):
		case 'reduce':
			return handleTransactionError(msg, error, ctx);

		case directory.address(action_send):
		case 'send':
			return handlePreflightError(msg, error, ctx);

		case directory.address(action_publish):
		case '_send':
			return handleSendError(msg, error, ctx);

		default:
			return ctx.escalate;
	}
}

function handlePreflightError(msg, error, ctx) {
	return ctx.escalate;
}

function handleTransactionError(msg, error, ctx) {
	if (error instanceof errors.ParamError) {
		if (error.web3Error.message.includes('nonce')) {
			return retry({ failedNonce: error.data.tx.nonce });
		} else {
			throw error;
		}
	}

	if (error instanceof errors.TransactionError) {
		return retry();
	}

	if (error instanceof errors.OnChainError) {
		// Fatal error, notify sinks
		dispatch(ctx.self, { type: directory.address(action_notifySinks), error }, ctx.self);
	}

	if (error.data && error.data.tx) {
		return ctx.escalate;
	}
}

async function action_send(state, msg, ctx) {
	const { tx: _tx, failedNonce, maxAttempts } = state;
	const tx = _tx || {};
	const _attempts = tx._attempts ? tx._attempts + 1 : 1;

	if (_attempts > (maxAttempts || MAX_ATTEMPTS)) {
		const error = new Error('Tx failed too many times');
		receiver_reduce(ctx)({ error });
	}

	tx.type = 'send';
	const { web3Instance } = await block(state.a_web3, { type: 'get' });
	const { nonce } = await block(state.a_nonce, {
		type: 'get_nonce',
		failedNonce,
		account: web3Instance.account,
		network: web3Instance.network,
	});

	let account;
	if (web3Instance.account) {
		account = web3Instance.account;
	} else {
		console.log(web3Instance.network);
		console.log(`Account: `, web3Instance.account);
		throw new Error(`No account defined for web3Instance`);
	}

	ctx.debug.info(msg, `Send from ${account}`);
	tx.opts = { ...tx.opts, from: account };
	console.log(directory.address(action_publish));

	dispatch(
		ctx.self,
		{ type: directory.address(action_publish), tx, web3Instance, nonce },
		ctx.self
	);
	//dispatch(ctx.self, { type: '_send', tx, web3Instance, nonce }, ctx.self);
	//dispatch(ctx.sender, {type: 'tx', txStatus: 'submitted', tx }, ctx.self);

	return {
		...state,
		error: null,
		tx,
	};
}

function action_publish(state, msg, ctx) {
	const { sendOpts, getSendMethod } = state;
	const { tx, web3Instance, nonce } = msg;

	if (!web3Instance)
		throw new Error(`web3:tx:action:publish: Message must contain web3Instance`);

	if (!(getSendMethod && typeof getSendMethod === 'function'))
		throw new Error(
			`web3:tx:action:publish: Must have 'getSendMethod' function available in state`
		);

	if (nonce === undefined || nonce === null) {
		throw new errors.ParamError(`Message must contain transaction nonce`, tx);
	}

	const opts = {
		gas: web3Instance.network.gasLimit,
		gasPrice: web3Instance.network.gasPrice,
		common: web3Instance.network.defaultCommon,
		...sendOpts,
		...tx.opts,
		nonce,
	};
	if (web3Instance.account) {
		opts.from = web3Instance.account;
	}

	if (!opts.to) {
		// TODO throw ParamError
		ctx.debug.warn(msg, `No to address specified`);
	}

	if (!!opts.value && opts.value > 0) {
		ctx.debug.d(
			msg,
			`Transfer ${utils.valueString(web3Instance.web3.utils)(
				opts.value
			)} from ${utils.abridgeAddress(opts.from)} to ${utils.abridgeAddress(opts.to)}`
		);
	}

	tx.nonce = nonce;
	const reduce = ctx.receivers.reduce || reduce({ ctx });

	getSendMethod(
		state,
		msg,
		ctx
	)(opts)
		.on('transactionHash', (hash) => {
			ctx.debug.info(msg, `... Pending ${hash}`);
			reduce({ hash });
		})
		.on('confirmation', (confirmationNumber, receipt, latestBlockHash) => {
			reduce({ confirmationNumber });
		})
		.on('receipt', (receipt) => {
			reduce({ receipt, error: null });
		})
		.on('error', (error, receipt) => {
			reduce({ receipt, error });
		})
		.then((receipt) => {})
		.catch((error, receipt) => {
			ctx.debug.warn(msg, `Swallowing sendMethod error: ${error}`);
		});
}

const retry = (opts) => {
	const { failedNonce } = opts;

	ctx.debug.d(msg, `Retrying tx: ${Object.values(state.tx)}`);
	dispatch(
		ctx.self,
		{
			type: directory.address(action_send),
			tx: { ...state.tx, _attempts },
			failedNonce,
		},
		ctx.self
	);
	return ctx.resume;
};

function action_reduceTxEvent(state, msg, ctx) {
	const { type, error, ...tx } = msg;
	const notify = notifySinks({ state, msg, ctx });

	if (error) {
		if (receipt) {
			// If receipt is provided web3js specifies tx was rejected on chain
			const onChainError = new OnChainError(error, tx, receipt);
			reduce({ error: onChainError });
		} else if (error.message.includes('not mined')) {
			reduce({ error: new TransactionError(error, tx) });
		} else {
			//console.dir(error);
			const paramError = new errors.ParamError(error, tx);
			reduce({ error: paramError });
		}

		// If caller problem, notify
		if (isServiceInterfaceError(error)) {
			return notify('error', error, { thenStop: true });
		}

		// If internal problem, retry
		throw error;
	}

	// @TODO config which events are received
	//ctx.receivers.sink;
	const nextState = { ...state, tx: { ...state.tx, ...tx } };
	notify(resolveStatus(nextState.tx), null, { tx: nextState.tx });
	// return action_notify(
	// 	nextState,
	// 	{ type: msg.type, status: resolveStatus(nextState), error: null },
	// 	ctx
	// );
}

// Allows onCrash to notify
function action_notifySinks(state, msg, ctx) {
	const { status, error, thenStop } = msg;
	notifySinks({ state, msg, ctx })(status, error, {
		thenStop,
	});
	return state;
}

// Receivers
function reduce({ ctx }) {
	return (payload) => {
		payload.type = directory.address(action_reduceTxEvent);
		dispatch(ctx.self, payload, ctx.self);
	};
}

// Fill sinks
function notifySinks({ state, msg, ctx }) {
	return (status, _error, opts) => {
		const { thenStop, tx: _tx } = opts || {};
		const { tx, error, sinks, kind } = state;

		const txState = _tx || tx || {};

		if (error) {
			txState.error = error;
		}

		ctx.debug.d(
			msg,
			`Notifying tx status change: ${status}. ${
				(txState && txState.error) || _error || ''
			}`
		);

		sinks.forEach((a_sink) =>
			dispatch(
				a_sink,
				{
					type: 'sink',
					action: 'send',
					kind,
					tx: txState,
					error: _error,
					txStatus: status,
				},
				ctx.self
			)
		);
		if (thenStop) stop(ctx.self);
	};
}

const _receivers = { reduce, notifySinks };
const _methods = { onCrash };

// @ TODO receivers should not be included in actions
module.exports = { ...actions, ...directory.actions, _receivers, _methods };
