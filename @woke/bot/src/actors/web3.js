const {
	Logger,
	twitter,
	web3Tools,
} = require('@woke/lib');
const { delay } = '../lib/utils'
const debug = (msg, args) => Logger().name(`WEB3`, `${msg.type}>> ` + args);

const web3Actor = {
	properties: {
		initialState: {
			web3Instance,
			waiting,
		}
	},

	'get': async (msg, ctx, state) => {
		const { web3Instance } = state;
		try {
			let networkId = await web3Instance.web3.eth.net.getId();
			dispatch(ctx.sender, { type: 'web3', web3Instance }, ctx.self);
		} catch(error) {
			debug(msg, `error getting network ID ${error}`);

			// Forward the get request to init
			dispatch(ctx.self, { type: 'init' }, ctx.sender); 
		}
	},

	// Requests for web3 instance that have to wait
	'wait': async (msg, ctx, state) => {
		const { ready } = msg;
		const { queue, web3Instance } = state;

		if(ready === true) {
			queue.forEach(sender => {
				dispatch(sender, { type: 'web3', web3Instance }, ctx.self)
			});
			return { ...state, queue: [] };
		} else {
			return { ...state, queue: [...queue, ctx.sender] };
		}
	},

	'init': async (msg, ctx, state) => {
		const { queue } = state;

		// Add this caller to the queue
		dispatch(ctx.self, {type: 'wait', ready: true }, ctx.sender);

		// If this is the first sender to join the queue
		// then start initialising the instance
		if(queue.length === 0) {
			getNewInstance()
		}

		function getNewInstance() {
			let web3Instance;
			const maxAttempts = 5;
			let attempts = 0;

			let connected = false;

			while(!connected) {
				++attempts
				web3Instance = web3Tools.init();

				if(attempts == 1) {
					console.dir(web3Instance.network);
				}

				try {
					debug(msg, `Attempting Web3 connection on network ${web3Instance.network.id} ...`);
					let networkId = await web3Instance.web3.eth.net.getId();
					debug(msg, `... connected to ${networkId}`);

					if(networkId != web3Instance.network.id) {
						throw new Error(`... got ${networkId}, but expected ${web3Instance.network.id}`);
					}

					connected = true;

				} catch (error) {
					debug.error('Encountered error trying to instantiate new Web3 instance ...');
					debug.error('... ', error);
				}

				if(!connected) {
					if(attempts >= maxAttempts) {
						debug(msg, `FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`);
						throw new Error( `FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`);
					}
					await delay(3000);
				}
			}

			const {web3, network, account} = web3Instance;

			if(ctx.sender && ctx.sender != ctx.self) {
				//dispatch(ctx.sender, { type: 'web3', web3Instance }, ctx.self);

				dispatch(ctx.self, {type: 'wait', ready: true }, ctx.self);
			}

			debug(msg, '... Web3 connection success');
			return {
				...state,
				web3Instance: { web3, network, account },
			}
		}
	}
}
