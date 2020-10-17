const {
	ActorSystem,
	actors: { Polling },
} = require('@woke/wact');
const {
	utils: { makeLogEventSubscription },
	init,
	methods: { makeContractInstanceFromConfig },
} = require('@woke/lib').web3Tools;
const { dispatch, block, start_actor } = ActorSystem;
const { blockTime } = init.network;

const INFURA_WS_TIMEOUT = 5 * 60 * 1000;
const GETH_NODE = 60 * 60 * 1000;
//const DEFAULT_WATCHDOG_INTERVAL = GETH_NODE;
const DEFAULT_WATCHDOG_INTERVAL = 30 * 1000;

let idx = 0;
const subscriptionActor = {
	properties: {
		initialState: {
			filter: (e) => e,
			subscription: null,
			subscribers: [],
			contractConfig: null,
			latestBlock: 0,
		},

		onCrash: (msg, error, ctx) => {
			console.log(`Subscription crash on msg:`, msg);
			console.log(error);
			switch (msg.type) {
				case 'handle':
				case 'subscribe':
					console.log('... subscription resuming');
					return ctx.resume;

				case 'start':
					return ctx.stop;

				default:
					console.log('Crash: reason below...');
					console.log(msg);
					return ctx.stop;
			}
		},
	},

	actions: {
		subscribe: async (state, msg, ctx) => {
			const { contractConfig, eventName, ...rest } = state;
			if (state.subscription) {
				await state.subscription.stop();
			}

			// Always get a fresh contract instance
			const { web3Instance } = await block(state.a_web3, { type: 'get' });
			const blockTime = web3Instance.network.blockTime;
			const contract = makeContractInstanceFromConfig(web3Instance)(contractConfig);

			const callback = (error, log) => {
				// Seperate subcription init from handling into distinict messages
				dispatch(ctx.self, { type: 'handle', error, log }, ctx.self);
			};

			const latestBlock = state.latestBlock ? state.latestBlock : 0;
			const subscription = makeLogEventSubscription(web3Instance.web3)(
				contract,
				eventName,
				callback,
				{
					fromBlock: latestBlock,
				}
			);

			subscription.start();
			ctx.debug.info(
				msg,
				`Subscribed with subscribers: ${state.subscribers.map((s) => s.name)}`
			);

			// So that the polling actor can use a query.
			dispatch(ctx.sender, { type: 'a_sub', action: 'subscribed' }, ctx.self);
			return { ...state, subscription, latestBlock };
		},

		start: (state, msg, ctx) => {
			const { watchdog, watchdogInterval } = state;
			const { resubscribeInterval } = msg;
			const period =
				resubscribeInterval || watchdogInterval || blockTime || DEFAULT_WATCHDOG_INTERVAL;
			if (watchdog && !state.a_watchdog) {
				ctx.debug.info(msg, `Starting subscription watchdog...`);
				state.a_watchdog = start_actor(ctx.self)('_watchdog', Polling);
				dispatch(
					state.a_watchdog,
					{
						type: 'poll',
						target: ctx.self,
						action: 'subscribe',
						period,
						blockTimeout: period * 10, // wait for action complete before next poll
					},
					state.a_watchdog
				);
			} else {
				dispatch(ctx.self, { type: 'subscribe' }, ctx.self);
			}
		},

		handle: (state, msg, ctx) => {
			const { eventName, contractName, subscribers, filter } = state;
			const { error, log } = msg;

			if (error) {
				throw new SubscriptionError(error, eventName);
			}

			if (log && filter(log.event)) {
				//if(log && filter ? filter(log.event) : true) {
				console.log(`Prev BN: ${state.latestBlock}, Log BN: ${log.blockNumber}`);
				const latestBlock =
					log.blockNumber > state.latestBlock ? log.blockNumber : state.latestBlock;

				subscribers.forEach((a_subscriber) => {
					dispatch(
						a_subscriber,
						{
							type: 'sink',
							kind: 'subscription',
							action: 'subscribe_log',
							contractName,
							eventName,
							log,
						},
						ctx.self
					);
				});

				return { ...state, latestBlock };
			}
		},

		resubscribe: async (state, msg, ctx) => {
			//const { web3Instance } = await block(state.a_web3, { type: 'get' });
			//const contract = initContract(web3Instance, state.contractInterface);
			dispatch(ctx.self, { type: 'start' }, ctx.self);
		},

		stop: (state, msg, ctx) => {
			const { subscription, a_watchdog } = state;
			if (a_watchdog) {
				dispatch(a_watchdog, { type: 'stop' });
			}
			subscription.stop();
			return ctx.stop;
		},
	},
};

class DomainError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class SubscriptionError extends DomainError {
	constructor(error, eventName) {
		// and tx data?
		super(`Subscription to '${eventName}' failed.`);
		this.data = { error, eventName };
	}
}

module.exports = subscriptionActor;
