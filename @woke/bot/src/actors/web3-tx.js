const { dispatch, query } = require('nact');
const { withEffect } = require('./effects');
//const web3Errors = require('web3-core-helpers').errors;

function initContract(web3Instance, interface) {
	return new web3Instance.web3.eth.Contract(
		interface.abi,
		interface.networks[web3Instance.network.id].address
	);
}

const properties = {
	initialState: {
		sinks: [],

		opts: {
			call: null,
			send: null,
		}
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
			dispatch(sink, {type: 'tx', tx, txStatus, txState}, ctx.self)
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

const onCrash = (msg, ctx, state) => {
	switch(msg.type) {
		case 'send': {
			// if the error was a block timeout we could handle and retry
			if(error instanceof OnChainError) {
				throw error;
			}
			handleOnChainError();
		}

		default: {
			return ctx.stop()
		}
	}
}

function handleOffChainError(error) {
	// Want the tx actor to crash'
	throw new Error(``)
}

function handleOnChainError(error) {
	// do some recovery
}

function reduce(msg, ctx, state) {
	msg.type = 'reduce';
	console.log(ctx.self);
	console.log(msg);
	dispatch(ctx.self, msg, ctx.self);
}

const INFINITE_WAIT = 1000*1000; // ms
const block = (_consumer, _msg) => {
	return query(_consumer, _msg, INFINITE_WAIT);
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

	'reduce': (msg, ctx, state) => {
		return withEffect(msg, ctx, state)((msg, ctx, state) => {
			//ctx.onlySelf()
			const { error, tx, sinks, txState, sent } = msg;

			if(error) {
				console.dir(error);
				//throw error;
			}

			const nextState = {
				...state,
				sent: sent ? sent : state.sent,
				error: {...error, error},
				tx: {
					...state.tx,
					...msg.tx,
				}
			}
			return nextState;
		})(dispatchSinks)
	},

	// Sender responses addressed to self
	'tx': async (msg, ctx, state) => {
		const { txStatus } = msg;

		if(txStatus == 'success') {
			ctx.debug.d(`Complete. Stopping...`);
			return ctx.stop();
		}
	},

	'call': async (msg, ctx, state) => {
		const { tx } = msg; 
		const { method, args } = tx;
		const { callOpts } = state;

		tx.type = 'call';
		const { web3Instance } = await block(state.a_web3, { type: 'get' });
		const opts = {
			...callOpts,
			...tx.opts,
		}

		const contract = initContract(web3Instance, state.contractInterface);
		const result = await contract.methods[method](...tx.args).call(opts)

		dispatch(ctx.sender, { type: 'tx', tx, result }, ctx.parent);
	},

	'send': async (msg, ctx, state) => {
		const { tx } = msg; 

		tx.type = 'send';
		const { web3Instance } = await block(state.a_web3, { type: 'get' });

		if(web3Instance.account) {
			tx.opts.from = web3Instance.account;
		} else {
			let account = (await web3Instance.web3.eth.personal.getAccounts())[0];
			tx.opts = {...tx.opts, from: account};
		}

		dispatch(ctx.self, { type: '_send', tx, web3Instance }, ctx.sender);
		//dispatch(ctx.sender, {type: 'tx', txStatus: 'submitted', tx }, ctx.self);
		return {
			...state,
			sent: true,
			error: null,
			tx,
		};
	},

	// @fix TODO: temporary work around
	//	-- errors from web3 promi-event don't get caught by the actor when called
	//	inside an async action without await
	'_send': (msg, ctx, state) => {
		// ctx.onlySelf();
		const { sendOpts } = state;
		const { tx, web3Instance } = msg; 

		const opts = {
			...sendOpts,
			...tx.opts,
		}
		if(web3Instance.account) {
			opts.from = web3Instance.account;
		}

		opts.from = null;

		const contract = initContract(web3Instance, state.contractInterface);
		contract.methods[tx.method](...tx.args).send(opts)
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
			.then( receipt => {
				dispatch(ctx.sender, {type: 'tx', txStatus: 'success', tx, receipt }, ctx.self);
			})
			.catch( (error, receipt) => {
				if(receipt) {
					// If receipt is provided web3js specifies tx was rejected on chain
					const onChainError = new OnChainError(error, tx, receipt);
					reduce({ error: onChainError }, ctx);
				} else {
					const paramError = new ParamError(error, tx);
					reduce({ error: paramError }, ctx);
				}
				//console.log('✂ ✂ ✂ ✂ ✂ ✂');
			})
	},
}

module.exports = { actions, properties };

class DomainError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class ParamError extends DomainError {
	constructor(error, tx) { // and tx data?
		super(`Transaction '${tx.method}' failed due to invalid parameters.`);
		this.data = { error, tx };
	}
}

class OnChainError extends DomainError {
	constructor(error, tx, receipt) { // and tx data?
		super(`Transactions ${receipt.transactionHash} failed.`);
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
