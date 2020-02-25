const { dispatch, query } = require('nact');
const { start_actor, block } = require('../actor-system');
const { initContract } = require('../lib/web3');

const subscriptionActor= {
	properties: {
		initialState: {
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

			const callback = (error, event) => {
				// Seperate subcription init from handling into distinict messages
				dispatch(ctx.self,  { type: 'handle', error, event }, ctx.self);
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

			return { ...state, subscription};
		},


		'handle': (msg, ctx, state) => {
			const {eventName, contractInterface, subscribers} = state;
			const { error, event } = msg;

			if(error) {
				throw new SubscriptionError(error, eventName);
			}

			if(event) {
				console.log(event);
				subscribers.forEach(a_subscriber => {
					dispatch(a_subscriber, { type: 'a_sub',
						contractName: contractInterface.contractName,
						eventName,
						event,
					}, ctx.parent)
				})
			}
		},

		'resubscribe': async (msg, ctx, state) => {
			const contract = initContract(web3Instance, state.contractInterface);
			const { web3Instance } = await block(state.a_web3, { type: 'get' });
			/*
			if(resubscribe) {
				setInterval(() => {
					self.checkConnection().then(() => {
						debug.d(`... resubscribed ${eventName}`)
						subscription.resubscribe();
					});
				}, 5*60*1000);
			}
			*/
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
	const start = () => {
		const eventJsonInterface = web3.utils._.find(
			contract._jsonInterface,
			o => o.name === eventName && o.type === 'event',
		);
		const newSub = web3.eth.subscribe('logs', {
			...opts,
			address: contract.options.address,
			topics: [eventJsonInterface.signature],
		}, (error, result) => {
			let event = result ? web3.eth.abi.decodeLog(
					eventJsonInterface.inputs,
					result.data,
					result.topics.slice(1)
			) : result;
			handleFunc(error, event)
		})

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
		super(`Subscription to '${eventName}' failed due to invalid parameters.`);
		this.data = { error, eventName };
	}
}

module.exports = subscriptionActor;
