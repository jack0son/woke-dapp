const { ActorSystem: { dispatch } } = require('@woke/wact');
const { web3Tools } = require('@woke/lib');
const { ProviderError } = require('../lib/errors');

const delay = async (ms) => new Promise(res => setTimeout(res, ms));

// @TODO define these timing constants in common lib
const timeouts = {}
const MAX_ATTEMPTS = 5;
const RETRY_DELAY = 400;

const AVG_BLOCK_TIME = 3*1000;


function Web3Actor (init_web3 = web3Tools.init.instantiate, maxAttempts = MAX_ATTEMPTS, opts) {
	const defaults = {
		retryDelay: RETRY_DELAY,
		networkList: [],
		monitor: undefined
	};
	const { monitor, retryDelay, networkList } = {...defaults, ...opts};

	function onCrash(msg, error, ctx) {
		switch(msg.type) {
			case 'instantiate': {
				if(error instanceof ProviderError) {
					if(!!monitor) dispatch(monitor, { type: 'fatal', error }, ctx.self);
					return ctx.resume;
				}
			}
			default:
				return ctx.stop;
		}
	}
	// @desc Create a web3 instance and validate the connection
	// @dev Allow several attempts before fatally crashing
	// @dev If network list provided to initial state, return web3 using the first
	// provider that successfully connects
	async function action_instantiate(msg, ctx, state) {
		const { queue, instance, maxAttempts, opts, networkList } = state;

		// @TODO: Clean up this logic: repetition
		if(!networkList || !!networkList && networkList.length == 0) {
			ctx.debug.warn(msg, `No redundancy providers specified, using default`);
		} 

		return createNewInstance();

		async function createNewInstance() {
			let web3Instance;
			let attempts = 0;

			let connected = false;

			let idx = 0;
			function getNetworkName() {
				if(idx < networkList.length) {
					return networkList[idx++];
				} 
				return undefined;
			}

			let networkName = getNetworkName();
			while(!connected) {
				++attempts;
				web3Instance = init_web3(networkName);

				if(attempts == 1) {
					ctx.debug.d(msg, `Using network ${web3Instance.network.id}:${web3Instance.network.host}`);
					ctx.debug.d(msg, `\tConnection URL ${web3Instance.rpcUrl}`);
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
						networkName = getNetworkName();
						if(!networkName) {
							ctx.debug.error(msg, `FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`);
							throw new ProviderError( `FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`)
						}
						attempts = 0;
						ctx.debug.d(msg, `Falling back to network ${networkName} with ${maxAttempts} attempts`);
					}
					await delay(retryDelay);
				}
			}

			dispatch(ctx.self, {type: 'wait', ready: true }, ctx.self);
			if(ctx.sender != ctx.self) {
				dispatch(ctx.self, {type: 'web3', web3Instance }, ctx.self);
			}
			return { ...state, web3Instance }
		}
	}

	// @desc Get a web3 instance. If one is not available, add the requester to
	// the queue and create a new web3 instance.
	async function action_get(msg, ctx, state) {
		const { web3Instance } = state;

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
	}

	// @desc Send web3 instance to waiting queue members
	// @dev Sender is added to queue and instantiate message sent.
	// Once instantiation is complete, it will dispatch another wait message
	// subsequently dipsatching the new instance to all queue members
	async function action_wait(msg, ctx, state) {
		const { ready } = msg;
		const { queue, web3Instance } = state;

		if(queue.length == 0) {
			ctx.debug.info(msg, `Triggering instantiate, with queue ${queue.length}`);
			dispatch(ctx.self, {type: 'instantiate'}, ctx.self);
		}

		if(ready === true) {
			// Instaniation complete
			queue.forEach(sender => {
				dispatch(sender, { type: 'web3', web3Instance }, ctx.self)
			});
			ctx.debug.info(msg, `Responded to ${queue.length} queue members`);
			return { ...state, queue: [] };
		} else {
			// Instantiation in progress
			ctx.debug.info(msg, `Adding ${ctx.sender.type} to queue`);
			return { ...state, queue: [...queue, ctx.sender] };
		}
	}

	// Provide a web3 instance to other actors
	// When the connection fails, re-instantiate
	return {
		properties: {
			onCrash,
			initialState: {
				queue: [],
				networkList,
				maxAttempts,
				opts
			}
		},

		actions: {
			'init': (msg, ctx, state) => {
				const { queue } = state;
				// Add this caller to the queue
				// NB the wait message must be dispatched before triggering
				// instantiation in order to synchronise the queue
				dispatch(ctx.self, {type: 'wait'}, ctx.sender);
			},
			'get': action_get,
			'wait': action_wait,
			'instantiate': action_instantiate,
		}
	}
}


module.exports = Web3Actor;
