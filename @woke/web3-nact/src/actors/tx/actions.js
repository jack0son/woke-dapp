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

function TxState() {
	return {
		status: 'init',
		error: null,
		hash: undefined,
		receipt: undefined,
		attempts: 0,
	};
}

// Errors that callers should receive details of
function isServiceInterfaceError(error) {
	// @TODO define service interface errors
	return error instanceof errors.InterfaceError || error instanceof errors.RevertError;
}

function isServiceFailureError(error) {
	// @TODO define service failure errors
	return error instanceof errors.ProviderError;
}

const actions = { action_send, action_publish, action_reduceTxEvent, action_notifySinks };
const directory = action.buildDirectory(actions);

// @TODO Create generic oncrash handler that can set a supervision policy per
// action
function onCrash(msg, error, ctx) {
	ctx.retry = retry({ msg, error, ctx });
	ctx.notify = () => {
		dispatch(
			ctx.self,
			{ type: directory.address(action_notifySinks), error, thenStop: true },
			ctx.self
		);
		return ctx.resume;
	};

	if (isServiceFailureError(error)) {
		return ctx.escalate; // a_contract or a_txManager will perform failure reporting
	}

	if (isServiceInterfaceError(error)) {
		return ctx.notify();
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

function handleSendError(msg, error, ctx) {
	return ctx.escalate;
}

function handlePreflightError(msg, error, ctx) {
	return ctx.escalate;
}

function handleTransactionError(msg, error, ctx) {
	const { tx } = msg;
	console.log(error);
	if (error instanceof errors.ParamError) {
		if (error.web3Error.message.includes('nonce')) {
			return ctx.retry({ tx, failedNonce: error.data.tx.nonce });
		} else {
			throw error;
		}
	}

	if (error instanceof errors.TransactionError) {
		return ctx.retry();
	}

	if (error instanceof errors.OnChainError) {
		// Fatal error, notify sinks
		return ctx.notify();
	}

	if (error.data && error.data.tx) {
		return ctx.escalate;
	}
}

async function action_send(state, msg, ctx) {
	const { maxAttempts, sinks, importantSinks } = state;
	const { failedNonce } = msg;

	if (msg.transactionSpec && msg.tx) {
		throw new Error('Should not receive new transaction specification with tx state');
	}

	const transactionSpec = msg.transactionSpec || state.transactionSpec;
	if (!transactionSpec) {
		throw new errors.InterfaceError(
			'Must provide transaction specification (web3.transactionObject OR opts)',
			'transactionSpec',
			transactionSpec
		);
	}

	// Tx property used internally by onCrash handlers so tx state from message
	// contents must take precedence
	const tx = msg.tx || state.tx || TxState();
	tx.attempts++;

	if (tx.attempts > (maxAttempts || MAX_ATTEMPTS)) {
		// @TODO classify this error
		throw new Error('Tx failed too many times');
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
	const { method, ...spec } = transactionSpec;
	if (method) tx.method = method;
	tx.opts = { ...spec, from: account };
	tx.nonce = nonce;

	dispatch(
		ctx.self,
		{ type: directory.address(action_publish), web3Instance, nonce },
		ctx.self
	);
	//dispatch(ctx.self, { type: '_send', tx, web3Instance, nonce }, ctx.self);
	//dispatch(ctx.sender, {type: 'tx', txStatus: 'submitted', tx }, ctx.self);

	return {
		...state,
		importantSinks: importantSinks || [],
		sinks,
		error: null,
		transactionSpec,
		tx,
	};
}

// Only called internally
function action_publish(state, msg, ctx) {
	const { sendOpts, getSendMethod, transactionSpec, tx, reportConfirmations } = state;
	const { web3Instance, nonce } = msg; // receive a fresh web3 instance from action_send

	if (!web3Instance)
		throw new Error(`web3:tx:action:publish: Message must contain web3Instance`);

	if (!(getSendMethod && typeof getSendMethod === 'function'))
		throw new Error(
			`web3:tx:action:publish: Must have 'getSendMethod' function available in state`
		);

	if (nonce === undefined || nonce === null) {
		throw new errors.ParamError(`Message must contain transaction nonce`, tx);
	}

	tx.nonce = nonce;
	const opts = {
		gas: web3Instance.network.gasLimit,
		gasPrice: web3Instance.network.gasPrice,
		common: web3Instance.network.defaultCommon,
		...sendOpts,
		...transactionSpec,
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

	ctx.reduce = reduce({ ctx });
	// @TODO replace with buildTxObject
	getSendMethod(
		state,
		msg,
		ctx
	)(opts)
		.on('transactionHash', (hash) => {
			ctx.debug.info(msg, `... Pending ${hash}`);
			ctx.reduce({ hash });
		})
		.on('confirmation', (confirmationNumber, receipt, latestBlockHash) => {
			!!reportConfirmations && ctx.reduce({ confirmationNumber });
		})
		.on('receipt', (receipt) => {
			ctx.reduce({ receipt, error: null });
		})
		.on('error', (error, receipt) => {
			ctx.reduce({ receipt, error });
		})
		.then((receipt) => {})
		.catch((error, receipt) => {
			ctx.debug.warn(msg, `Swallowing sendMethod() error: ${error}`);
		});

	state.tx = tx;
	return state;
}

// onCrash receiver
const retry = ({ msg, error, ctx }) => (opts) => {
	const { failedNonce } = opts;

	ctx.debug.d(msg, `Retrying tx...`);
	dispatch(
		ctx.self,
		{
			type: directory.address(action_send),
			failedNonce,
		},
		ctx.self
	);
	return ctx.resume;
};

function action_reduceTxEvent(state, msg, ctx) {
	const { type, ..._tx } = msg;
	//const notify = notifySinks({ state, msg, ctx });

	const tx = { ...state.tx, ..._tx };

	let error = null;
	if (_tx._error) {
		if (tx.receipt) {
			// If receipt is provided web3js specifies tx was rejected on chain
			error = new OnChainError(error, tx, receipt);
		} else if (error.message.includes('not mined')) {
			error = new TransactionError(error, tx);
		} else {
			//console.dir(error);
			error = new errors.ParamError(error, tx);
		}

		// If internal problem, retry
		if (!isServiceInterfaceError(error)) {
			throw error;
		}
		// If problem for caller, notify
	}

	// @TODO config which events are received
	const nextState = { ...state, tx: { ...tx, error } };
	return action_notifySinks(
		nextState,
		{ type: 'reduce', thenStop: !!error, original: msg },
		ctx
	);
}

// Receivers
function reduce({ ctx }) {
	return (payload) => {
		payload.type = directory.address(action_reduceTxEvent);
		dispatch(ctx.self, payload, ctx.self);
	};
}

// Allows onCrash to notify sinks (needs access to actor state)
function action_notifySinks(state, msg, ctx) {
	const { error, thenStop } = msg;

	if (error) state.error = error;
	notifySinks({ state, msg, ctx })(error, { thenStop });
	return state;
}

const importantStatuses = new Set(['error', 'success']);

// Fill sinks
const notifySinks = ({ state, msg, ctx }) => (_error, opts) => {
	//const { thenStop, tx: _tx } = opts || {};
	const { thenStop } = opts || {};
	const { tx, sinks, kind, importantSinks } = state;

	//const txState = _tx || msg.tx || state.tx;
	// const txState = msg.tx || state.tx;

	if (!tx) throw new Error('Attempt to notify of with empty tx state');

	const status = _error ? 'error' : resolveStatus(tx);

	ctx.debug.d(
		msg,
		`Notifying tx status change: ${status}. ${(tx && tx.error) || _error || ''}`
	);

	const notify = (consumer) => {
		dispatch(
			consumer,
			{
				type: 'sink',
				action: 'send',
				kind,
				status,
				tx,
				error: _error,
			},
			ctx.self
		);
	};

	// Dispatch notify messages
	importantStatuses.has(status) && importantSinks.forEach(notify);
	sinks.forEach(notify);

	if (thenStop) stop(ctx.self);
};

const _receivers = { reduce, notifySinks };
const _methods = { onCrash };

// @ TODO receivers should not be included in actions
module.exports = { ...actions, ...directory.actions, _receivers, _methods };
