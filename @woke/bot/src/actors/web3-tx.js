const { dispatch } = require('nact');
const { withEffect } = require('./effects');

const properties = {
	initialState: {
		sinks: []
	}
}

// A parent actor can persist the sendTx messages then spin up a send actor for
// each one, get notified of the result, then mark the tx message discarded or
// complete

// A sink is an actor that wants to be notified of a change to status
// Behaves like an effect, with state.status as a dependency
// @param _state: original state
function dispatchSinks(msg, ctx, state) {
	const { sinks } = state;
	const prevState = state._state;
	// modifiers.isEffect()
	const status = resolveStatus(state.tx);
	if(status !== resolveStatus(prevState.tx)) {
		sinks.forEach(sink => 
			dispatch(sink, {tx, txStatus, txState}, ctx.self)
		);
	}
}

function resolveStatus(txState) {
	if(txState.error) {
		return 'error';
	} else if(txState.receipt){
		return 'success'
	} else if(txState.hash) {
		return 'pending';
	} else {
		return 'UNDEFINED'
	}
}

const actions = {
	'get_status': (msg, ctx, state) => {
		dispatch(ctx.sender, { status: resolveStatus(ctx.txState), txState }, ctx.self);
	},

	// Add sender to list of sinks to all changes in status
	// Pub sub pattern
	// -- could generalise this to attach to any state property
	'sink_status': (msg, ctx, state) => {
		const { sinks } = state;

		return {
			...state,
			sinks: [...sinks, ctx.sender],
		}
	},

	'reduce': withEffect((msg, ctx, state) => {
		ctx.onlySelf()
		const { tx, sinks, txState } = state;
		const prevStatus = resolveStatus(txState);

		dispatch(ctx.sink, {msg}, ctx.self)

		const nextState = {
			...state,
			stage: msg.stage,
			error: msg.error,
			tx: {
				...state.tx,
				...msg.tx,
			}
		}
		return nextState;

	})(dispatchSinks),

	'send': async (msg, ctx, state) => {
		const { sendOpts } = state

		const opts = {
			...sendOpts,
			...msg.opts,
		}

		await contract.myMethod(...args).send(opts)
			.on('transactionHash', hash => {
				reduce({
					tx: {...tx, hash}
				}, ctx);
			})
			.on('confirmation', (confNumber, receipt) => {
				// @note not using this for now
				//reduce({})
			})
			.on('receipt', receipt => {
				reduce({
					receipt: receipt,
					error: null,
				}, ctx);
			})
			.on('error', (error, receipt) => {
				if(receipt) {
					// If receipt is provided web3js specifies tx was rejected on chain
					ctx.debug.error(`OnChainError: ${error}`);
					reduce({
						error: new OnChainError(error, receipt),
						receipt: receipt,
					})
				}
				ctx.debug.error(`TxError: ${error}`);
				console.log(error);
				console.log(receipt);
			});
	}
}

module.exports = { actions, properties };

class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class OnChainError extends DomainError {
  constructor(error, reciept) { // and tx data?
    super(`Transactions ${tx.hash} failed.`);
		this.data = { receipt, error }
  }
}

class RevertError extends DomainError {
  constructor(tx) {
		if(tx.reason) {
			super(`Transaction reverted '${tx.reason}`);
		} else {
			super(`No reason given`);
		}
		this.data = { tx }
  }
}

//
//
// Copying react reconciliation
//state.effects.forEach(effect => {
//	if(!deepEqual(nextState[effect.key], kkk
//});

/*
function statusHasSinks(status, sinks) {
	return sinks && Array.isArray(sinks[status]) ? sinks[status] : []
}

function affectStatusSinks(msg, ctx, state) {
	if(status !== prevStatus) {
		statusHasSinks(status, sinks).forEach(sink => 
			dispatch(sink, {tx, txStatus, txState}, ctx.self)
		);
	}
}

	// Add the sender to the list of sinks for a given tx status
	// -- simplify this, just sink to any status update
	'sink_a_status': (msg, ctx, state) => {
		const { sinks } = state;
		const { status } = msg;

		return {
			...state,
			sinks: {
				...sinks,
				[status]: [...sinks.status, ctx.sender]
			}
		}
	},
*/
