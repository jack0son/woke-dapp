const { dispatch } = require('nact');
const {
	Logger,
	twitter,
	web3Tools,
} = require('@woke/lib');
const { delay } = require('../lib/utils');

// @TODO define these timing constants in common lib
const timeouts = {}
const MAX_ATTEMPTS = 5;
const RETRY_DELAY = 400;

// Provide a web3 instance to other actors
// When the connection fails, re-instantiate
const Web3Actor = (init_web3 = web3Tools.init, maxAttempts = MAX_ATTEMPTS, opts) => ({
	properties: {
		initialState: {
			queue: [],
			maxAttempts,
			opts
		}
	},

	actions: {
		'get': async (msg, ctx, state) => {
			const { web3Instance } = state;
			ctx.debug.d(msg, 'Get instance...');

			if(!web3Instance) {
				return forwardToInit();
			}

			try {
				let networkId = await web3Instance.web3.eth.net.getId();
				dispatch(ctx.sender, { type: 'web3', web3Instance }, ctx.self);
			} catch(error) {
				ctx.debug.error(msg, `error getting network ID: ${error}`);

				return forwardToInit();
			}

			// Forward the get request to init
			function forwardToInit() {
				dispatch(ctx.self, { type: 'init' }, ctx.sender); 
				return;
			}
		},

		// Requests for web3 instance that have to wait
		'wait': async (msg, ctx, state) => {
			const { ready } = msg;
			const { queue, web3Instance } = state;

			if(queue.length == 0) {
				ctx.debug.d(msg, `Triggering instantiate, with queue ${queue.length}`);
				dispatch(ctx.self, {type: 'instantiate'}, ctx.self);
			}

			ctx.debug.d(msg, `${queue.length} in queue`);
			if(ready === true) {
				queue.forEach(sender => {
					dispatch(sender, { type: 'web3', web3Instance }, ctx.self)
				});
				return { ...state, queue: [] };
			} else {
				ctx.debug.d(msg, `Adding ${ctx.sender.type} to queue`);
				return { ...state, queue: [...queue, ctx.sender] };
			}
		},
		
		'init': (msg, ctx, state) => {
			const { queue } = state;
			// Add this caller to the queue
			// NB the wait message must be dispatched before triggering
			// instantiation in order to synchronise the queue
			dispatch(ctx.self, {type: 'wait'}, ctx.sender);
		},

		'instantiate': async (msg, ctx, state) => {
			const { queue, instance, maxAttempts, opts } = state;
			const retryDelay = opts && opts.retryDelay || RETRY_DELAY;

			return getNewInstance();

			async function getNewInstance() {
				let web3Instance;
				let attempts = 0;

				let connected = false;

				while(!connected) {
					++attempts
					web3Instance = init_web3();

					if(attempts == 1) {
						ctx.debug.d(msg, `Using network ${web3Instance.network.id}:${web3Instance.network.host}`);
					}

					try {
						ctx.debug.d(msg, `Attempt ${attempts}: connect to network ${web3Instance.network.id} ...`);
						let networkId = await web3Instance.web3.eth.net.getId();
						ctx.debug.d(msg, `... connected to ${networkId}`);

						if(networkId != web3Instance.network.id) {
							throw new Error(`... got ${networkId}, but expected ${web3Instance.network.id}`);
						}

						connected = true;

					} catch (error) {
						//ctx.debug.d(msg, 'Encountered error trying to instantiate new Web3 instance ...');
						ctx.debug.error(msg, error);
					}

					if(!connected) {
						if(attempts >= maxAttempts) {
							ctx.debug.error(msg, `FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`);
							const error = new Error( `FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`)
							throw error;
						}
						await delay(retryDelay);
					}
				}

				dispatch(ctx.self, {type: 'wait', ready: true }, ctx.self);
				if(ctx.sender != ctx.self) {
					dispatch(ctx.self, {type: 'web3', web3Instance }, ctx.self);
				}
				ctx.debug.d(msg, '... Web3 connection success');
				return { ...state, web3Instance }
			}
		}
	}
})

module.exports = Web3Actor;
