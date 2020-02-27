const { dispatch, query } = require('nact');
const { block } = require('../actor-system');
const { withEffect } = require('./effects');
const { initContract } = require('../lib/web3');
//const web3Errors = require('web3-core-helpers').errors;

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
	const prevState = state._state;
	const prevStatus = resolveStatus({...prevState.tx, error: prevState.error})

	const { tx, error, sinks } = state;
	//console.log(sinks);

	const status = resolveStatus({...tx, error});
	//console.log(prevStatus);
	//console.log(status);
	if(status != prevStatus ) {
		//sinks.forEach(sink => console.log(sink));
		sinks.forEach(sink => {
			dispatch(sink, {type: 'tx', tx: state.tx, error, txStatus: status}, ctx.self)
		});
		ctx.debug.info(msg, `${prevStatus} => ${status}`);

		if(status == 'success') {
			dispatch(ctx.self, {type: 'tx', txStatus: status }, ctx.self);
		}
	}

	return state;
}

function resolveStatus(txState) {
	//console.log(txState);
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
				//return handleOnChainError(error);
				throw error;
			} else if (error instanceof ParamError) {
				if(isNonceError(error)) {
				}
				throw error;
			}

		}

		default: {
			return ctx.stop()
		}
	}
}

function reduce(msg, ctx, state) {
	msg.type = 'reduce';
	dispatch(ctx.self, msg, ctx.self);
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

	'reduce': (msg, ctx, state) => withEffect(msg, ctx, state)(
		(msg, ctx, state) => {
			//ctx.onlySelf()
			const { error, tx } = msg;

			if(error) {
				if(error instanceof OnChainError) {
					console.log(error);
				} else if(error instanceof TransactionError) {
					console.log(error);
					console.log("RETRY");
					dispatch(ctx.self, { type: 'send', tx }, ctx.self);
					return state;
				} else if(error.data && error.data.tx) {
					console.log(error.data.tx);
					throw error;
				}
			}

			const nextState = {
				...state,
				error,
				tx: {
					...state.tx,
					...tx,
				}
			}
			return nextState;
		})(dispatchSinks),

	// Sender responses addressed to self
	'tx': async (msg, ctx, state) => {
		const { txStatus } = msg;

		if(txStatus == 'success') {
			ctx.debug.d(`Complete. Stopping...`);
			return ctx.stop;
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
		return ctx.stop;
	},

	'send': async (msg, ctx, state) => {
		const { tx } = msg; 

		tx.type = 'send';
		const { web3Instance } = await block(state.a_web3, { type: 'get' });
		const { nonce } = await block(state.a_nonce, { type: 'get_nonce',
			account: web3Instance.account,
			network: web3Instance.network,
		});

		// console.log('nonce: ', nonce);

		let account;
		if(web3Instance.account) {
			account = web3Instance.account;
		} else if(process.env.NODE_ENV == 'development') {
			account = (await web3Instance.web3.eth.personal.getAccounts())[1];
		} else {
			console.log(web3Instance.network);
			console.log(`Account: `, web3Instance.account);
			throw new Error(`No account defined for web3Instance`);
		}
		ctx.debug.info(msg, `Send from ${account}`);
		tx.opts = {...tx.opts, from: account};

		dispatch(ctx.self, { type: '_send', tx, web3Instance, nonce }, ctx.self);
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
	// @notice this action hands if it is made async
	'_send': (msg, ctx, state) => {
		// ctx.onlySelf();
		const { sendOpts } = state;
		const { tx, web3Instance, nonce } = msg; 

		if(nonce === undefined) {
			throw new ParamError(`No nonce provided to tx actor _send`, tx);
		}

		const opts = {
			gas: web3Instance.network.gasLimit,
			gasPrice: web3Instance.network.gasPrice,
			common: web3Instance.network.defaultCommon,
			...sendOpts,
			...tx.opts,
			nonce,
		}
		if(web3Instance.account) {
			opts.from = web3Instance.account;
		}

		const contract = initContract(web3Instance, state.contractInterface);
		contract.methods[tx.method](...tx.args).send(opts)
			.on('transactionHash', hash => {
				ctx.debug.info(msg, `... Pending ${hash}`)
				reduce({
					tx: { hash }
				}, ctx);
			})
			.on('confirmation', (confNumber, receipt) => {
				// @note not using this for now
				//reduce({})
			})
			.on('receipt', receipt => {
				reduce({
					tx: { receipt },
					error: null,
				}, ctx);
			})
			.on('error', (error, receipt) => {
				if(receipt) {
					// If receipt is provided web3js specifies tx was rejected on chain
					const onChainError = new OnChainError(error, tx, receipt);
					reduce({ error: onChainError }, ctx);
				} else if(error.message.includes('not mined')) {
					reduce({ error: new TransactionError(error, tx)}, ctx);
				} else {
					const paramError = new ParamError(error, tx);
					reduce({ error: paramError }, ctx);
				}
			})
			.then( receipt => {
				//reduce({ tx: { receipt }, tx }, ctx);
				//console.log('GOT RECEIPT -- REEEEEEEE');
				//dispatch(ctx.sender, {type: 'tx', txStatus: 'success', tx, receipt }, ctx.self);
				//dispatch(ctx.self, {type: 'tx', txStatus: 'success', tx, receipt }, ctx.self);
			})
			.catch( (error, receipt) => {
				// Caught by promi-event error listener
			})
	},
}

module.exports = { actions, properties };

/*
 *    { error:
      { Error: Transaction was not mined within 50 blocks, please make sure your transaction was properly sent. Be aware that it might still be mined!
          at Object.TransactionError (/home/jack/Repositories/jgitgud/woke-dapp/@woke/lib/node_modules/web3-core-helpers/src/errors.js:63:21)
          at /home/jack/Repositories/jgitgud/woke-dapp/@woke/lib/node_modules/web3-core-method/src/index.js:495:40
          at process._tickCallback (internal/process/next_tick.js:68:7) receipt: undefined },
					*/


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

class TransactionError extends DomainError {
	constructor(error, tx) { // and tx data?
		super(`Transaction '${tx.method}' failed.`);
		this.data = { error, tx };
	}
}

class OnChainError extends DomainError {
	constructor(error, tx, receipt) { // and tx data?
		super(`Transactions ${receipt.transactionHash} failed on chain.`);
		this.data = { receipt, tx, error }
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
