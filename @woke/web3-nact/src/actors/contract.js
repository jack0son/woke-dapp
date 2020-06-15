const { dispatch, query } = require('nact');
const { start_actor, block } = require('@woke/wact').ActorSystem;
const { initContract } = require('@woke/lib').web3Tools.utils;

const txActor = require('./web3-tx');
const subActor = require('./subscriber');

let tx_idx = 0;
function spawn_tx(ctx, state) {
	return start_actor(ctx.self)(
		`_tx-${tx_idx++}`,
		txActor,
		{
			sinks: [ctx.sender], // forward the sender to this tx
			a_web3: state.a_web3,
			a_nonce: state.a_nonce,
			contractInterface: state.contractInterface,
		}
	);
}

let sub_idx = 0;
const spawn_sub = (msg, ctx, state) => {
	return start_actor(ctx.self)(
		`_sub-${sub_idx++}-${state.contractInterface.contractName}-${msg.eventName}`,
		subActor,
		{
			watchdog: true,
			eventName: msg.eventName,
			filter: msg.filter,
			contractInterface: msg.contractInterface,
			subscribers: msg.subscribers, // forward the sender to this tx
			a_web3: state.a_web3,
		}
	);
}

const contractActor = {
	properties: {
		initialState: {
			a_web3: undefined,
			a_nonce: undefined,
			contractInterface: undefined,
			logSubscriptions: [],
			//contract,
			//web3Instance,
		},

		onCrash: {
			// Crash reasons
			// -- web3 cannot eventuall connect --> FATAL

			// Options
			// 1. if waiting for web3 ...
		},

		onCrash: undefined
	},

	actions: {
		'init': async (msg, ctx, state) => {
			const { web3Instance } = await block(state.a_web3, { type: 'get' }, 2000);
			const contract = initContract(web3Instance, contractInterface);

			dispatch(ctx.sender, { type: 'contract_object', contract }, ctx.self);
		},

		'send': async (msg, ctx, state) => {
			const { method, args, opts } = msg;

			if(!Array.isArray(args)) {
				throw new Error(`Send expects parameter args to be Array`);
			}

			const a_tx = spawn_tx(ctx, state); // parent is me
			dispatch(a_tx, {type: 'send', tx: { method, args, opts}}, ctx.sender);

		},

		'call': async (msg, ctx, state) => {
			const { method, args, opts} = msg;

			if(!Array.isArray(args)) {
				throw new Error(`Call expects parameter args to be Array`);
			}

			// 1. spawn a transaction actor
			const a_tx = spawn_tx(ctx, state); // parent is me
			dispatch(a_tx, {type: 'call', tx: { method, args, opts}}, ctx.sender);

			//let r = await contract.methods[method](...args).call(callOpts);
			// @TODO Errors to handle
			// -- Error: Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.
			// -- TypeError: contract.methods[method] is not a function
		},

		'subscribe_log': async (msg, ctx, state) => {
			const { eventName, filter, subscribers, opts } = msg;
			const { logSubscriptions, contractInterface } = state;
			const a_sub = spawn_sub({eventName,
				contractInterface,
				filter,
				subscribers: [ctx.sender],
			}, ctx, state);
			dispatch(ctx.sender, { type: 'a_contract', action: 'new_sub', a_sub}, ctx.self);

			logSubscriptions.push(a_sub);
			return  { ...state, logSubscriptions };
		},

		'unsubscribe_log': async (msg, ctx, state) => {
			const { logSubscriptions } = state;
			logSubscriptions.forEach(a_sub => dispatch(a_sub, { type: 'stop' }, ctx.self));
		},
	}
};

module.exports = contractActor;
