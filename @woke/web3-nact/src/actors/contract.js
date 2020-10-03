const {
	ActorSystem,
	receivers: { sink },
} = require('@woke/wact');
const { start_actor, dispatch, block } = ActorSystem;
const { configure } = require('@woke/lib');
const { makeContractInstance } = require('../lib/contract');

const { ContractTx } = require('./contract-tx');
const subscriberDefn = require('./subscriber');

let tx_idx = 0;
function spawn_tx(state, ctx) {
	return start_actor(ctx.self)(
		`_tx-${tx_idx++}`,
		ContractTx(state.a_web3, state.a_nonce, state.contractConfig),
		{
			sinks: [ctx.sender], // forward the sender to this tx
			// a_web3: state.a_web3,
			// a_nonce: state.a_nonce,
			// contractInterface: state.contractInterface,
		}
	);
}

let sub_idx = 0;

const subscriptionDefaults = {
	resubscribe: true,
	resubscribeInterval: undefined,
	filter: (e) => e,
};
const spawn_subscription = ({ state, msg, ctx }) => {
	//return (parent, web3Actor, contractName, eventName, contractConfig, ) => {
	return (eventName, filter, opts) => {
		subscriptionDefaults.subscribers = [ctx.sender];
		const { name, contractConfig, a_web3 } = state;

		// @TODO configure options should set arrayMerge to concatenate
		const conf = configure(opts, subscriptionDefaults);
		// @TODO Configure should concat arrays

		// Member lookups should happen inside returned function otherwise they are
		// called on every message
		return start_actor(ctx.self)(
			`_sub-${sub_idx++}-${name}-${msg.eventName}`,
			subscriberDefn,
			{
				contractName: name,
				contractConfig,
				a_web3,
				watchdogInterval: conf.resubscribeInterval,
				watchdog: conf.resubscribe,
				eventName: eventName,
				filter: filter,
				subscribers: conf.subscribers, // forward the sender to this tx
			}
		);
	};
};

const contractActor = {
	properties: {
		initialState: {
			a_web3: undefined,
			a_nonce: undefined,
			contractConfig: undefined,
			logSubscriptions: [],
			kind: 'a_contract',
			name: 'CONTRACT_NAME',
			//contract,
			//web3Instance,
		},

		receivers: [sink, spawn_subscription],
		Receivers: (bundle) => ({
			sink: sink(bundle),
		}),

		onCrash: {
			// Crash reasons
			// -- web3 cannot eventuall connect --> FATAL
			// Options
			// 1. if waiting for web3 ...
		},

		onCrash: undefined,
	},

	actions: {
		init: async (state, msg, ctx) => {
			const { web3Instance } = await block(state.a_web3, { type: 'get' }, 2000);
			const contract = initContract(web3Instance, contractInterface);

			dispatch(ctx.sender, { type: 'contract_object', contract }, ctx.self);
		},

		send: async (state, msg, ctx) => {
			const { method, args, opts, sinks } = msg;

			if (!Array.isArray(args)) {
				throw new Error(`Send expects parameter args to be Array`);
			}

			const a_tx = spawn_tx(state, ctx); // parent is me
			dispatch(
				a_tx,
				{ type: 'send', transactionSpec: { method, args, opts }, sinks },
				ctx.sender
			);
		},

		call: async (state, msg, ctx) => {
			const { method, args, opts } = msg;

			if (!Array.isArray(args)) {
				throw new Error(`Call expects parameter args to be Array`);
			}

			// 1. spawn a transaction actor
			const a_tx = spawn_tx(state, ctx); // parent is me
			dispatch(a_tx, { type: 'call', tx: { method, args, opts } }, ctx.sender);

			//let r = await contract.methods[method](...args).call(callOpts);
			// @TODO Errors to handle
			// -- Error: Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.
			// -- TypeError: contract.methods[method] is not a function
		},

		subscribe_log: async (state, msg, ctx) => {
			const { eventName, filter, subscribers, opts, resubscribeInterval } = msg;
			const { logSubscriptions, contractInterface } = state;

			const subscriptionOpts = { resubscribeInterval, ...opts };
			if (subscribers) subscriptionOpts.subscribers = subscribers;

			const a_sub = ctx.receivers.spawn_subscription(eventName, filter, subscriptionOpts);
			ctx.receivers.sink({ a_sub });
			//dispatch(ctx.sender, { type: 'a_contract', kind: 'contract', action: 'new_sub', a_sub}, ctx.self);

			logSubscriptions.push(a_sub);
			return { ...state, logSubscriptions };
		},

		unsubscribe_log: async (state, msg, ctx) => {
			const { logSubscriptions } = state;
			logSubscriptions.forEach((a_sub) => dispatch(a_sub, { type: 'stop' }, ctx.self));
		},
	},
};

module.exports = contractActor;
