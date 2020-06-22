const { ActorSystem, actors: { Polling } } = require('@woke/wact');
const { utils: { initContract }, init } = require('@woke/lib').web3Tools;
const { dispatch, block, start_actor } = ActorSystem;

const { network: blockTime } = init();

/*
 *
		dispatch(self.a_polling, { type: 'poll',
			target: self.a_tMon,
			action: 'find_tips',
			period: self.config.TWITTER_POLLING_INTERVAL,
		}, self.a_tweetForwarder);
		*/

const INFURA_WS_TIMEOUT = 5*60*1000;
const GETH_NODE = 60*60*1000;
//const DEFAULT_WATCHDOG_INTERVAL = GETH_NODE;
const DEFAULT_WATCHDOG_INTERVAL = 4*1000;

let idx = 0;
const subscriptionActor = {
	properties: {
		initialState: {
			filter: e => e,
			subscription: null,
			subscribers: [],
			contractInterface: null,
			latestBlock: 0,
		},

		onCrash: (msg, error, ctx) => {
			console.log(`Subscription crash on msg:`, msg);
			console.log(error);
			switch(msg.type) {
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
		}
	},

	actions: {
		'subscribe': async (msg, ctx, state) => {
			const { contractInterface, eventName, ...rest } = state;
			if(state.subscription) {
				await state.subscription.stop();
			}

			// Always get a fresh contract instance
			const { web3Instance } = await block(state.a_web3, { type: 'get' });
			const blockTime = web3Instance.network.blockTime; 
			const contract = initContract(web3Instance, contractInterface);

			const callback = (error, log) => {
				// Seperate subcription init from handling into distinict messages
				dispatch(ctx.self,  { type: 'handle', error, log }, ctx.self);
			}

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
			ctx.debug.info(msg, `Subscribed with subscribers: ${state.subscribers.map(s => s.name)}`);

			// So that the polling actor can use a query.
			dispatch(ctx.sender, {type: 'a_sub', action: 'subscribed'}, ctx.self);
			return { ...state, subscription, latestBlock};
		},

		'start': (msg, ctx, state) => {
			const { resubscribeInterval } = msg;
			const { contractInterface, eventName, watchdog } = state;
			if(watchdog && !state.a_watchdog) {
				ctx.debug.info(msg, `Starting subscription watchdog...`);
				state.a_watchdog = start_actor(ctx.self)('_watchdog', Polling);
				dispatch(state.a_watchdog, { type: 'poll',
					target: ctx.self,
					action: 'subscribe',
					period: resubscribeInterval || blockTime || DEFAULT_WATCHDOG_INTERVAL,
					blockTimeout: (blockTime || DEFAULT_WATCHDOG_INTERVAL)*3, // wait for action complete before next poll
				}, state.a_watchdog);
			} else {
				dispatch(ctx.self, {type: 'subscribe'}, ctx.self);
			}
		},

		'handle': (msg, ctx, state) => {
			const {eventName, contractInterface, subscribers, filter} = state;
			const { error, log} = msg;

			if(error) {
				throw new SubscriptionError(error, eventName);
			}

			if(log && filter ? filter(log.event) : true) {
				const latestBlock = log.blockNumber > state.latestBlock ?
					log.blockNumber : state.latestBlock;

				subscribers.forEach(a_subscriber => {
					dispatch(a_subscriber, { type: 'a_sub',
						contractName: contractInterface.contractName,
						eventName,
						log,
					}, ctx.self)
				})

				return { ...state, latestBlock }
			}


		},

		'resubscribe': async (msg, ctx, state) => {
			//const { web3Instance } = await block(state.a_web3, { type: 'get' });
			//const contract = initContract(web3Instance, state.contractInterface);
			dispatch(ctx.self, { type: 'start' }, ctx.self);
		},

		'stop': (msg, ctx, state) => {
			const { subscription, a_watchdog } = state;
			if(a_watchdog) {
				dispatch(a_watchdog, { type: 'stop' });
			}
			subscription.stop();
			return ctx.stop;
		},
	}
}


const makeLogEventSubscription = web3 => (contract, eventName, handleFunc, opts) => {
	let subscription = null;

	const eventJsonInterface = web3.utils._.find(
		contract._jsonInterface,
		o => o.name === eventName && o.type === 'event',
	);
	const handleUpdate = (error, result) => {
		let event = result ? web3.eth.abi.decodeLog(
			eventJsonInterface.inputs,
			result.data,
			result.topics.slice(1)
		) : result;
		handleFunc(error, {...result, event})
	}

	const start = () => {
		const newSub = web3.eth.subscribe('logs', {
			...opts,
			address: contract.options.address,
			topics: [eventJsonInterface.signature],
		}, handleUpdate); 

		//console.log(`... Subscribed to ${eventName} ${opts && opts.fromBlock ? `bn: ${opts.fromBlock}` : ''}`);
		//console.log(newSub);
		subscription = newSub;
		subscription.on("data", log => console.log);
	}

	// @fix Ubscribing does not appear to work on web3js@1.2.5
	const stop = () => subscription.unsubscribe();

	const resubscribe = () => {
		console.log(`... Resubscribed to ${eventName}.`);
		subscription.subscribe(handleUpdate);
	}

	return {
		start,
		resubscribe,
		stop,
	}
}

class DomainError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class SubscriptionError extends DomainError {
	constructor(error, eventName) { // and tx data?
		super(`Subscription to '${eventName}' failed.`);
		this.data = { error, eventName };
	}
}

module.exports = subscriptionActor;
