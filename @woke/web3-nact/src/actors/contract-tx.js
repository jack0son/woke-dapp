const { ActorSystem, effects, receivers: { sink } } = require('@woke/wact');
const { dispatch, block } = require('@woke/wact').ActorSystem;
const { initContract } = require('@woke/lib').web3Tools.utils;
const { withEffect } = effects;
const { ParamError, TransactionError, OnChainError } = require('../lib/errors');
//const web3Errors = require('web3-core-helpers').errors;

// @TODO handle revert error

const properties = {
}

const MAX_ATTEMPTS = 4;



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

	'reduce': (msg, ctx, state) 
	// Sender responses addressed to self
	'tx': async (msg, ctx, state) => {
		const { txStatus } = msg;

		if(txStatus == 'success') {
			ctx.debug.d(msg, `Complete. Stopping...`);
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

		//dispatch(ctx.sender, { type: 'tx', tx, result }, ctx.parent);
		ctx.receivers.sink({ tx, result }, ctx.parent);
		return ctx.stop;
	},

	'send': async (msg, ctx, state) => {
		const { tx, failedNonce } = msg; 

		tx.type = 'send';
		const { web3Instance } = await block(state.a_web3, { type: 'get' });
		const { nonce } = await block(state.a_nonce, { type: 'get_nonce',
			failedNonce,
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

		const contract = initContract(web3Instance, state.contractInterface);
		const sendMethod = contract.methods[tx.method](...tx.args);

		return txActor.action_send(msg, ctx, { ...state, sendMethod });
	}

module.exports = { actions, properties };

/*
 *    { error:
      { Error: Transaction was not mined within 50 blocks, please make sure your transaction was properly sent. Be aware that it might still be mined!
          at Object.TransactionError (/home/jack/Repositories/jgitgud/woke-dapp/@woke/lib/node_modules/web3-core-helpers/src/errors.js:63:21)
          at /home/jack/Repositories/jgitgud/woke-dapp/@woke/lib/node_modules/web3-core-method/src/index.js:495:40
          at process._tickCallback (internal/process/next_tick.js:68:7) receipt: undefined },
					*/
