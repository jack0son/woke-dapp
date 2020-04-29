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
	const address = artifact.networks[web3Instance.network.id].address;
	debug.d(`Initialising ${artifact.contractName} at ${address}`);
	return  new web3Instance.web3.eth.Contract(artifact.abi, address);
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
			debug.d(web3Instance.network);
			const network = web3Instance.network;
			console.log(`Connecting to ethereum network ID ${network.id}:${network.defaultCommon.customChain.name} on ${network.host}`);
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

const getEvents = wokeToken => async (eventName, filter) => {
	let opts = {
		fromBlock: 0,
	}
	let events = await wokeToken.getPastEvents(eventName, opts);
	if(filter)
		events.filter(e => {
			let match = true;
			Object.keys(filter).forEach(prop => {
				if(e.returnValues[prop] != filter[prop])
					match = false;
			})
			return match;
		})

	return events;
}

const getClaimedEvents = wokeToken => async (_claimerAddress, _claimerId) => {
	/*
	let opts = {
		fromBlock: 0,
	}
	let events = await wokeToken.getPastEvents('Claimed', opts);

	if(_claimerAddress) 
		events = events.filter(e => e.returnValues.account == _claimerAddress)

	if(_claimerId) 
		events = events.filter(e => e.returnValues.userId == _claimerId)
		*/
	return getEvents(wokeToken)('Claimed', { account: _claimerAddress, userId: _claimerId });

	//return events;
}

const getRewardEvents = wokeToken => async (_claimerId, _referrerId) => {
	let opts = {
		fromBlock: 0,
	}
	let events = await wokeToken.getPastEvents('Reward', opts);

	if(_claimerId) 
		events = events.filter(e => e.returnValues.claimerId == _claimerId)

	if(_referrerId) 
		events = events.filter(e => e.returnValues.referrerId == _referrerId)

	return events;
}

const getTransferEvents = wokeToken => async (_fromId, _toId) => {
	let opts = {
		fromBlock: 0,
		// @fix these params are not indexed in WokeToken.sol
		//fromId: _fromId,
		//toId: _toId,
	}

	let events = await wokeToken.getPastEvents('Tx', opts);

	if(_fromId) 
		events = events.filter(e => e.returnValues.fromId == _fromId)

	if(_toId) 
		events = events.filter(e => e.returnValues.toId == _toId)

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

const getTokenSupply = wokeToken => (_opts) => {
	let opts = {
		..._opts,
		//from: account
	};
	return wokeToken.methods.totalSupply().call(opts);
}

const getUnclaimedPool = wokeToken => (_opts) => {
	let opts = {
		..._opts,
		//from: account
	};
	return wokeToken.methods.balanceOf(wokeToken._address).call(opts);
}


const getUsers = wokeToken => async userId => {
	let opts = { fromBlock: 0 };
	let events = await wokeToken.getPastEvents('Claimed', opts);
	if(nonEmptyString(userId)) {
		events = events.filter(e => e.returnValues.userId == userId)
	}

	if(events.length && events.length > 0) {
		return events.map(e => e.returnValues);
	}

	return null;
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
				return false;
			}
		}
	}

	return true;
}

const twitterUsers = twitter => {
	const users = {};
		const getHandle = (() =>  {
			return async (userId) => {
				if(!users[userId]) {
					try {
					users[userId] = (await twitter.getUserData(userId)).handle
					} catch(error) {
						console.log('Error: twitter: ', error);
						users[userId] = 'DELETED';
					}
				}
				return users[userId];
			};
		})();

		let userIds = [];
		const addId = (id) => {
			if(!userIds.includes(id)) userIds.push(id);
		}

	return { getHandle, addId, users, userIds }
}

const fetchUserHandles = twitterUsers => async userIds => {
		userIds.forEach(id => twitterUsers.addId(id));
		debug.d('Fetching user handles...');
		await Promise.all(twitterUsers.userIds.map(id => twitterUsers.getHandle(id)));
}

const printId = id => id.padEnd(20, ' ');

// Inefficient but convenient
const createCommands = ctx => ({
	wokeToken: {
		supply: async (showMintEvents) => {
			const supply = await getTokenSupply(ctx.wokeToken)();
			const bonusPool = await getUnclaimedPool(ctx.wokeToken)();
			console.log(`Total supply: ${supply}.W, Unclaimed: ${bonusPool}.W, ${(100*bonusPool/supply).toFixed(3)}%`);

			if(showMintEvents) {
				const claimedEvents = await getClaimedEvents(ctx.wokeToken)();
				const rewardEvents = await getEvents(ctx.wokeToken)('Reward', {});

				let bonusTotal = 0;
				claimedEvents.forEach(e => {
					console.log(`${printId(e.returnValues.userId)}:\t${e.returnValues.amount}.W`);
					bonusTotal += parseInt(e.returnValues.amount);
				});

				let rewardTotal = 0;
				rewardEvents.forEach(e => {
					console.log(`${printId(e.returnValues.referrerId)}:\t${e.returnValues.amount}.W`);
					rewardTotal += parseInt(e.returnValues.amount);
				});
				console.log(`\nTotal claimed: ${bonusTotal}`);
				console.log(`Total rewarded: ${rewardTotal}`);
			}
		},
	},

	getTweetText: async (userId) => {
		const tweet = await getTweetText(ctx.oracle)(userId);
		if(!nonEmptyString(tweet)) {
			console.log('None found.');
			return;
		}
		console.dir(tweet);
		return;
	},

	getUser: async (userId) => {
		const users = await getUsers(ctx.wokeToken)(userId);
		if(!users) {
			console.log('None found.');
			return;
		}
		await fetchUserHandles(ctx.twitterUsers)(users.map(u => u.userId));

		users.forEach((u,i) => console.log(`${i}:${printId(ctx.twitterUsers.users[u.userId])}\t${printId(u.userId)}\t${u.account}`));

		return;
	},

	getRewardEvents: async (claimer, referrer) => {
		const events = await getRewardEvents(ctx.wokeToken)(claimer, referrer);
		if(!(events && events.length)) {
			console.log('None found.');
			return;
		}

		await fetchUserHandles(ctx.twitterUsers)(events.map(e => e.returnValues.referrerId).concat(events.map(e => e.returnValues.claimerId)));
		const users = ctx.twitterUsers;

		const eventList = events.map(e => ({
			blockNumber: e.blockNumber,
			returnValues: e.returnValues,
			summary: `${e.blockNumber}:\t@${users.users[e.returnValues.referrerId]} received ${e.returnValues.amount}.W for referring @${users.users[e.returnValues.claimerId]}`
		}));
		eventList.forEach(e => console.log(e.summary))
		console.log('\nTotal bounty rewards: ', eventList.length);

		return;
	},

	getTransferEvents: async (from, to) => {
		const events = await getTransferEvents(ctx.wokeToken)(from, to);
		if(!(events && events.length)) {
			console.log('None found.');
			return;
		}

		const userIds = [];
		events.forEach(e => {userIds.push(e.returnValues.toId); userIds.push(e.returnValues.fromId)});
		const users = ctx.twitterUsers;
		await fetchUserHandles(users)(userIds);

		const eventList = events.map(e => ({
			blockNumber: e.blockNumber,
			returnValues: e.returnValues,
			summary: `${e.blockNumber}:\t@${users.users[e.returnValues.fromId]} sent ${e.returnValues.amount}.W to ${e.returnValues.claimed ? 'claimed' : 'unclaimed'} user @${users.users[e.returnValues.toId]}`
		}));

		eventList.forEach(e => console.log(e.summary))
		console.log('\nTotal transfers: ', eventList.length);
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
		twitterUsers: twitterUsers(twitter),
	}
}

const bindCommands = async () => (createCommands(await initContext()));

// Example usage
if(require.main === module) {
	//debug.debug.enabled = true;
	var argv = process.argv.slice(2);
	const [command, ...args] = argv;

	const usage = {
		getTweetText: 'getTweetText <userId>',
		getUser: 'getUser <userId>',
		getRewardEvents: 'getRewardEvents [[claimer,referrer] <userId>]',
		getTransferEvents: 'getTransferEvents [[from,to] <userId>]',
		supply: 'supply [minted]',
	};

	(async () => {
		let commands = Object.keys(usage).includes(command) && (await bindCommands()); // don't work for nothing

		switch(command) {
			case 'supply': {
				const showMintEvents = args[0];
				return commands.wokeToken.supply(showMintEvents);
			}

			case 'getTweetText': {
				const userId = args[0];
				if(!nonEmptyString(userId)) {
					console.log('No value provided for userId');
					console.log(usage.getTweetText);
					return;
				}
				debug.d('Getting tweet text for user ', userId);

				return commands.getTweetText(userId)
			}

			case 'getUser': {
				const userId = args[0];
				if(nonEmptyString(userId)) {
					debug.d('Getting data for user', userId);
				}

				return commands.getUser(userId)
			}

			case 'getRewardEvents': {
				const [selectRole, userId] = args;
				debug.d('Getting reward events', selectRole ? `for ${selectRole} ${userId}` : '');
				switch(selectRole) {
					case 'claimer':
						return commands.getRewardEvents(userId)
					case 'referrer':
						return commands.getRewardEvents(undefined, userId)
					default:
						return commands.getRewardEvents()
				}
			}

			case 'getTransferEvents': {
				const [type, userId] = args; // type: <from, to>
				debug.d('Getting transfers', type ? ` for ${type} ${userId}` : '');
				switch(type) {
					case 'from':
						return commands.getTransferEvents(userId)
					case 'to':
						return commands.getTransferEvents(undefined, userId)
					default: 
						return commands.getTransferEvents()
				}
			}

			case 'help':
			case '--help':
			case '-h':
			default: {
				console.log('Woke Contracts CLI v0.1.0\nUsage: ');
				Object.keys(usage).forEach(c => console.log('  ' + usage[c]))
			}

				return;
		}
	})().catch(console.log);
}

function nonEmptyString(str) {
	return str !== undefined && str !== null && str.length && str.length > 0;
}

function timeoutPromise(ms) {
	return new Promise((resolve, reject) => setTimeout(() => {
		resolve();
	}, ms));
}
