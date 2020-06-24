const { ActorSystem, effects, receivers: { sink } } = require('@woke/wact');
const { dispatch, block } = require('@woke/wact').ActorSystem;
const { initContract } = require('@woke/lib').web3Tools.utils;
const { withEffect } = effects;
const { ParamError, TransactionError, OnChainError } = require('../lib/errors');

const TxActor = require('./tx');
const txActions = TxActor.actions;

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

async function action_call(msg, ctx, state) {
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
}

	// @fix TODO: temporary work around
	//	-- errors from web3 promi-event don't get caught by the actor when called
	//	inside an async action without await
	// @notice this action hands if it is made async
function action_send(msg, ctx, state) {
		const { tx, web3Instance, nonce } = msg; 

		const contract = initContract(web3Instance, state.contractInterface);
		const sendMethod = contract.methods[tx.method](...tx.args);

		return txActions.action_send(msg, ctx, { ...state, sendMethod });
}

const ContractTx = {
	properties: {
		...TxActor.properties,
	},

	actions: {
		'tx': txActions.action_tx,
		'reduce': txActions.action_reduce,
		'call': action_call,
		'send': txActions.action_sendPreflight,
		'_send': action_send,
		'get_status': txActions.action_getStatus,
		'sink_status': txActions.action_sinkStatus,
	}
}


module.exports = ContractTx;
