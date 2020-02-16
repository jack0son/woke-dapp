const { dispatch } = require('nact');
const { withEffect } = require('./effects');

const properties = {
	initialState: {
		sinks: []
	}
}

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
	if(txState.pending) {
		return 'pending';
	} else if(txState.error) {
		return 'error';
	} else if(txState.receipt){
		return 'success'
	} else {
		return undefined
	}
}

const actions = {
	'get_status': (msg, ctx, state) => {
		dispatch(ctx.sender, { status: resolveStatus(ctx.txState), txState }, ctx.self);
	},

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
				}, ctx);
			})
			.on('confirmation', (confNumber, receipt) => {
				reduce({
				}, ctx);
			})
			.on('receipt', receipt => {
				reduce({
				}, ctx);
			})
			.on('error', (error, receipt) => {
				if(receipt) {
					// Transaction rejected on chain
				}

				reduce({
				}, ctx);
			});
	}
}

module.exports = { actions, properties };
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
*/
