const { ActorSystem, effects } = require('@woke/wact');
const {
	web3Tools: { utils },
} = require('@woke/lib');
const { dispatch, block } = ActorSystem;
const { withEffect } = effects;
const {
	ParamError,
	TransactionError,
	OnChainError,
} = require('../../lib/errors');

//const web3Errors = require('web3-core-helpers').errors;

// @TODO replace this state machine with new reducer pattern
// @TODO handle revert error
const MAX_ATTEMPTS = 4;

function resolveStatus(txState) {
	//console.log(txState);
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

function reduce(msg, ctx, state) {
	msg.type = 'reduce';
	dispatch(ctx.self, msg, ctx.self);
}

// A parent actor can persist the sendTx messages then spin up a send actor for
// each one, get notified of the result, then mark the tx message discarded or
// complete

// A sink is an actor that wants to be notified of a change to status
// Behaves like an effect, with state.status as a dependency
// @param _state: original state
function dispatchSinks(msg, ctx, state) {
	const prevState = state._state;
	const prevStatus = resolveStatus({ ...prevState.tx, error: prevState.error });

	const { tx, error, sinks, kind } = state;
	//console.log(sinks);

	const status = resolveStatus({ ...tx, error });
	//console.log(prevStatus);
	//console.log(status);
	if (status != prevStatus) {
		//sinks.forEach(sink => console.log(sink));
		sinks.forEach((a_sink) => {
			const msgPayload = { type: 'tx', tx: state.tx, error, txStatus: status };
			//dispatch(a_sink, msgPayload, ctx.self)
			dispatch(
				a_sink,
				{
					type: 'sink',
					action: 'send',
					kind,
					tx: state.tx,
					error,
					txStatus: status,
				},
				ctx.self
			);
			//ctx.receivers.sink(msgPayload);
		});
		ctx.debug.info(msg, `${prevStatus} => ${status}`);

		if (status == 'success') {
			dispatch(ctx.self, { type: 'tx', txStatus: status }, ctx.self);
		}
	}

	return state;
}

// Sender responses addressed to self
async function action_tx(msg, ctx, state) {
	const { txStatus } = msg;

	if (txStatus == 'success') {
		ctx.debug.d(msg, `Complete. Stopping...`);
		return ctx.stop;
	}
}

function action_getStatus(msg, ctx, state) {
	dispatch(
		ctx.sender,
		{ status: resolveStatus(ctx.txState), txState },
		ctx.self
	);
}

async function action_sendPreflight(msg, ctx, state) {
	const { tx, failedNonce } = msg;

	tx.type = 'send';
	const { web3Instance } = await block(state.a_web3, { type: 'get' });
	const { nonce } = await block(state.a_nonce, {
		type: 'get_nonce',
		failedNonce,
		account: web3Instance.account,
		network: web3Instance.network,
	});

	// console.log('nonce: ', nonce);

	let account;
	if (web3Instance.account) {
		account = web3Instance.account;
	} else if (process.env.NODE_ENV == 'development') {
		account = (await web3Instance.web3.eth.personal.getAccounts())[1];
	} else {
		console.log(web3Instance.network);
		console.log(`Account: `, web3Instance.account);
		throw new Error(`No account defined for web3Instance`);
	}
	ctx.debug.info(msg, `Send from ${account}`);
	tx.opts = { ...tx.opts, from: account };

	dispatch(ctx.self, { type: '_send', tx, web3Instance, nonce }, ctx.self);
	//dispatch(ctx.sender, {type: 'tx', txStatus: 'submitted', tx }, ctx.self);
	return {
		...state,
		error: null,
		tx,
	};
}

const action_reduce = (msg, ctx, state) =>
	withEffect(
		msg,
		ctx,
		state
	)((msg, ctx, state) => {
		//ctx.onlySelf()
		const { error, tx } = msg;

		let _error;
		const retry = (opts) => {
			const { failedNonce } = opts;
			const _attempts = state.tx._attempts ? state.tx._attempts + 1 : 1;
			if (_attempts > MAX_ATTEMPTS) {
				_error = new Error('Tx failed too many times');
				return { ...state, error: _error }; // notify sinks
			}

			ctx.debug.d(msg, `Retrying tx: ${Object.values(state.tx)}`);
			dispatch(
				ctx.self,
				{ type: 'send', tx: { ...state.tx, _attempts }, failedNonce },
				ctx.self
			);
			return state; // absorb the error
		};

		// @brokenwindow
		// This withEffect pattern breaks the let it crash philosophy
		// This decision shouldn't be handled in the action logic.
		//
		// Challenge here is to distinguish between errors that the tx sink
		// should be notified of and errors that the tx should just handle itself
		//	-- if you wanted to get complex the sink could specifiy an error
		//	policy the same way an actor specifies an onCrash policy
		if (error) {
			console.log(error);
			if (error instanceof OnChainError) {
			}
			if (error instanceof ParamError) {
				if (error.web3Error.message.includes('nonce')) {
					return retry({ failedNonce: error.data.tx.nonce });
				} else {
					throw error;
				}
			} else if (error instanceof TransactionError) {
				return retry();
			} else if (error.data && error.data.tx) {
				throw error;
			}
		}

		const nextState = {
			...state,
			error: _error || error,
			tx: {
				...state.tx,
				...tx,
			},
		};
		return nextState;
	})(dispatchSinks);

function action_send(msg, ctx, state) {
	const { sendOpts, sendMethod } = state;
	const { tx, web3Instance, nonce } = msg;

	if (nonce === undefined) {
		throw new ParamError(`No nonce provided to tx actor _send`, tx);
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
			)} from ${utils.abridgeAddress(opts.from)} to ${utils.abridgeAddress(
				opts.to
			)}`
		);
	}

	tx.nonce = nonce;
	sendMethod(opts)
		.on('transactionHash', (hash) => {
			ctx.debug.info(msg, `... Pending ${hash}`);
			reduce(
				{
					tx: { hash },
				},
				ctx
			);
		})
		.on('confirmation', (confNumber, receipt) => {
			// @note not using this for now
			//reduce({})
		})
		.on('receipt', (receipt) => {
			reduce(
				{
					tx: { receipt },
					error: null,
				},
				ctx
			);
		})
		.on('error', (error, receipt) => {
			if (receipt) {
				// If receipt is provided web3js specifies tx was rejected on chain
				const onChainError = new OnChainError(error, tx, receipt);
				reduce({ error: onChainError }, ctx);
			} else if (error.message.includes('not mined')) {
				reduce({ error: new TransactionError(error, tx) }, ctx);
			} else {
				//console.dir(error);
				const paramError = new ParamError(error, tx);
				reduce({ error: paramError }, ctx);
			}
		})
		.then((receipt) => {
			//reduce({ tx: { receipt }, tx }, ctx);
			//console.log('GOT RECEIPT -- REEEEEEEE');
			//dispatch(ctx.sender, {type: 'tx', txStatus: 'success', tx, receipt }, ctx.self);
			//dispatch(ctx.self, {type: 'tx', txStatus: 'success', tx, receipt }, ctx.self);
		})
		.catch((error, receipt) => {
			// Caught by promi-event error listener
		});
}

// Add sender to list of sinks to all changes in status
// Pub sub pattern
// -- could generalise this to attach to any state property
function action_sinkStatus(msg, ctx, state) {
	const { sinks } = state;

	return {
		...state,
		sinks: [...sinks, ctx.sender],
	};
}

module.exports = {
	action_tx,
	action_sendPreflight,
	action_send,
	action_reduce,
	action_getStatus,
	action_sinkStatus,
};

/*
 *    { error:
      { Error: Transaction was not mined within 50 blocks, please make sure your transaction was properly sent. Be aware that it might still be mined!
          at Object.TransactionError (/home/jack/Repositories/jgitgud/woke-dapp/@woke/lib/node_modules/web3-core-helpers/src/errors.js:63:21)
          at /home/jack/Repositories/jgitgud/woke-dapp/@woke/lib/node_modules/web3-core-method/src/index.js:495:40
          at process._tickCallback (internal/process/next_tick.js:68:7) receipt: undefined },
					*/
