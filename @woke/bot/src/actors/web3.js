const {
	Logger,
	twitter,
	web3Tools,
} = require('@woke/lib');
const { delay } = '../lib/utils'

const web3Actor = {
	properties: {
		initialState: {
			web3Instance,
		}
	},

	'dead': async (msg, ctx, state) => {
	},

	'watchDog': async (msg, ctx, state) => {
	},

	'init': async (msg, ctx, state) => {

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
				debug.d(`Attempting Web3 connection on network ${web3Instance.network.id} ...`);
				let networkId = await web3Instance.web3.eth.net.getId();
				debug.d(`... connected to ${networkId}`);

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
					debug.d(`FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`);
					return false;
				}
				await delay(3000);
			}
		}

		const {web3, network, account} = web3Instance;
		self.web3 = web3;
		self.network = network;
		self.address = account;

		debug.d('... Web3 connection success');
		return true;
	}
}
