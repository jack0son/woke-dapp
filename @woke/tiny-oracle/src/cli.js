const {
	Logger,
	twitter,
	web3Tools,
} = require('@woke/lib');
const artifacts = require('@woke/contracts')[process.env.NODE_ENV !== 'development' ? 'production' : 'development'];
const debug = Logger('oracle');
debug.d('Interfaces available on networks: ', Object.keys(artifacts.WokeToken.networks));

const oracleInterface = artifacts.TwitterOracleMock;
const wokeTokenInterface = artifacts.WokeToken;

function initContract(web3Instance, artifact) {
	return  new web3Instance.web3.eth.Contract(artifact.abi, artifact.networks[web3Instance.network.id].address);
}

async function initWeb3() {

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
			await timeoutPromise(3000);
		}
	}

	const {web3, network, account} = web3Instance;

	debug.d('... Web3 connection success');
	return web3Instance;
}

const getTweetText = oracle => async (_userId, _opts) => {
	let opts = {
		..._opts,
		//from: account
	};
	let r = await oracle.methods.getTweetText(
		_userId
	).call(opts);
	return r;
}

const getRewardEvents = wokeToken => async (_claimerId, _referrerId) => {
	let opts = {
		fromBlock: 0,
		claimerId: _claimerId,
		referrerId: _referrerId,
	}


	const events = await wokeToken.getPastEvents('Reward', opts);

	return events;

}

const oracleSend = oracle => async (method, args, txOpts) => {
	/*
	let txOpts = {
		gas: self.network.gasLimit,
		gasPrice: self.network.gasPrice,
		common: self.network.defaultCommon,
	};*/
	let opts = {
		...txOpts,
		from: account
	};
	let r = await oracle.methods[method](
		...args
	).send(opts);
}

const checkConnection = async web3Instance =>  {
	const maxAttempts = 3;
	let attempts = 0;
	let connected = false;
	let networkId;

	debug.d('Checking Web3 connection ...');
	while(!connected) {
		attempts += 1;
		try {
			networkId = await web3Instance.web3.eth.net.getId();
			connected = true;
		} catch (error) {
			debug.d('... ERROR: ', error);
		}

		if(!connected) {
			if(attempts < maxAttempts) {
				await timeoutPromise(2000);
			} else {
				await web3Instance.initWeb3();
				web3Instance.initContract();
				attempts = 0;
			}
		}
	}
}


// Inefficient but convenient
const createCommands = ctx => ({
	getTweetText: async (userId) => {
		const tweet = await getTweetText(ctx.oracle)(userId);
		if(!nonEmptyString(tweet)) {
			console.log('None found.');
			return;
		}
		console.dir(tweet);
		return;
	},

	getRewardEvents: async (claimer, referrer) => {
		const events = await getRewardEvents(ctx.wokeToken)(claimer, referrer);
		if(!(events && events.length)) {
			console.log('None found.');
			return;
		}

		users = {}
		const getHandle = (() =>  {
			return async (userId) => {
				if(!users[userId]) {
					users[userId] = (await twitter.getUserData(userId)).handle
				}
				return users[userId];
			};
		})();

		let userIds = [];
		const addId = (id) => {
			if(!userIds.includes(id)) userIds.push(id);
		}
		events.forEach(e => {addId(e.returnValues.referrerId); addId(e.returnValues.claimerId)});
		debug.d('Fetching user handles...');
		await Promise.all(userIds.map(id => getHandle(id)));
		const eventList = events.map(e => ({
			blockNumber: e.blockNumber,
			returnValues: e.returnValues,
			summary: `${e.blockNumber}:\t@${users[e.returnValues.referrerId]} received ${e.returnValues.amount}.W for referring @${users[e.returnValues.claimerId]}`
		}));

		eventList.forEach(e => console.log(e.summary))
		return;
	}
})

async function initContext() {
	const web3Instance = await initWeb3();
	const oracle = initContract(web3Instance, oracleInterface);
	const wokeToken = initContract(web3Instance, wokeTokenInterface);
	await twitter.initClient()

	return{
		web3Instance,
		oracle,
		wokeToken,
		twitter,
	}
}

const commands = async () => (createCommands(await initContext()));

// Example usage
if(require.main === module) {
	//debug.debug.enabled = true;
	var argv = process.argv.slice(2);
	const [command, ...args] = argv;

	const usage = {
		getTweetText: 'getTweetText USERID',
		getRewardEvents: 'getRewardEvents [CLAIMERID] [REFERRERID]',
	};

	(async () => {

		switch(command) {
			case 'getTweetText': {
				const userId = args[0];
				if(!nonEmptyString(userId)) {
					console.log('No value provided for USERID');
					console.log(usage.getTweetText);
					break;
				}
				debug.d('Getting tweet text for user ', userId);
				(await commands()).getTweetText(userId);
				break;
			}

			case 'getRewardEvents': {
				const [claimerId, referrerId] = args;
				debug.d(`Getting reward events, claimer:${claimerId} referrer:${referrerId}`);
				(await commands()).getRewardEvents(claimerId, referrerId)
				break;
			}

			default: {
				console.log('Commands: ');
				console.log('  ' + usage.getTweetText);
				console.log('  ' + usage.getRewardEvents);
			}

				return;
		}
	})();
}

function nonEmptyString(str) {
	return str !== undefined && str !== null && str.length && str.length > 0;
}

function timeoutPromise(ms) {
	return new Promise((resolve, reject) => setTimeout(() => {
		resolve();
	}, ms));
}
