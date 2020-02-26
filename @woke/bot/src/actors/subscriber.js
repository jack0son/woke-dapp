const { dispatch, query, spawnStateless } = require('nact');
const { start_actor, block } = require('../actor-system');
const { initContract } = require('../lib/web3');

let idx = 0;
const subscriptionActor= {
	properties: {
		initialState: {
			filter: e => e,
			subscription: null,
			subscribers: [],
			contractInterface: null,
		},

		onCrash: (msg, ctx, state) => {
			switch(msg.type) {
				case 'handle': {
					break;
				}

				case 'start': {
					return ctx.stop;
					break;
				}

				default: {
					return ctx.stop;
					break;
				}
			}
		}
	},

	actions: {
		'start': async (msg, ctx, state) => {
			const {contractInterface, eventName, subscribers} = state;

			const { web3Instance } = await block(state.a_web3, { type: 'get' });
			const contract = initContract(web3Instance, contractInterface);

			if(state.subscription) {
				return;
			}

			const callback = (error, log) => {
				// Seperate subcription init from handling into distinict messages
				dispatch(ctx.self,  { type: 'handle', error, log }, ctx.self);
			}

			const subscription = makeLogEventSubscription(web3Instance.web3)(
				contract,
				eventName,
				callback,
				{
					fromBlock: 0,
				}
			);

			subscription.start();

			const resubber = spawnStateless(ctx.self, 
				(msg, _ctx) => {
					const sub = ctx.self;
					setInterval(() => {
						block(state.a_web3, {type: 'get'}).then(() => {
							//dispatch(sub, { type: 'resubscribe' }, sub);
							subscription.resubscribe();
						});
					}, 5*60*1000);
				},
				`_resub-${idx++}`,
			);

			dispatch(resubber, {type: 'go go go!'}, ctx.self);

			return { ...state, subscription, subscribers: [...subscribers, ctx.sender]};
		},


		'handle': (msg, ctx, state) => {
			const {eventName, contractInterface, subscribers, filter} = state;
			const { error, log} = msg;

			if(error) {
				throw new SubscriptionError(error, eventName);
			}

			if(log && filter ? filter(log.event) : true) {
				//console.log(event);
				subscribers.forEach(a_subscriber => {
					//console.log(log.transactionHash);
					//console.log(`${subscribers.length}: Subscriber: `, a_subscriber.name ? a_subscriber.name : a_subscriber.system.name)
					dispatch(a_subscriber, { type: 'a_sub',
						contractName: contractInterface.contractName,
						eventName,
						log,
					}, ctx.self)
				})
			}
		},

		'resubscribe': async (msg, ctx, state) => {
			//const { web3Instance } = await block(state.a_web3, { type: 'get' });
			//const contract = initContract(web3Instance, state.contractInterface);
			const { subscription } = state;
			subscription.resubscribe();
			console.log(`... resubscribed ${eventName}`)

		},

		'stop': (msg, ctx, state) => {
			const {subscription} = state;
			subscription.stop();
			return ctx.stop();
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

		console.log(`... Subscribed to ${eventName}.`);
		//console.log(newSub);
		subscription = newSub;
		subscription.on("data", log => console.log);
	}

	const stop = () => new Promise((resolve, reject) => 
		subscription.unsubscribe((error, succ) => {
			if(error) {
				reject(error);;
			}
			console.log(`... unsub'd ${eventName}`);
			resolve(succ);
		})
	);

	const resubscribe = () => {
		console.log(`... Resubscribed to ${eventName}.`);
		subscription.subscribe();
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
		super(`Subscription to '${eventName}' failed due to invalid parameters.`);
		this.data = { error, eventName };
	}
}

module.exports = subscriptionActor;
