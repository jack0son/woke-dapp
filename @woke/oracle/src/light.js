// @deprecated
const { Logger, twitter, web3Tools } = require('@woke/lib');
const artifacts = require('@woke/contracts');
const debug = Logger('oracle');

// TODO implement actor based oracle
const { bootstrap, block } = require('../../bot/src/actor-system');
const { contract, Web3, nonce } = require('../../bot/src/actors');

const oracleMockInterface =
	artifacts[process.env.NODE_ENV !== 'development' ? 'production' : 'development']
		.TwitterOracleMock;

const INFURA_WS_TIMEOUT = 5 * 60 * 1000;
const GETH_NODE = 60 * 60 * 1000;
const DEFAULT_WATCHDOG_INTERVAL = GETH_NODE;

function timeoutPromise(ms) {
	return new Promise((resolve, reject) =>
		setTimeout(() => {
			resolve();
		}, ms)
	);
}

// @dev Minimal oracle server to respond to queries in the mock oracle contract.
class TinyOracle {
	constructor(args, opts) {
		const { web3, oracleInterface, address, network } = args;
		this.address = address;
		this.oracleInterface = oracleMockInterface;
		this.network = network;
		this.web3 = web3;
		this.subscribedEvents = {};

		if (opts) {
			twitter = opts.twitter || twitter;
			this.director = opts.director;
		}
	}

	async initWeb3() {
		const self = this;

		let web3Instance;
		const maxAttempts = 5;
		let attempts = 0;

		let connected = false;

		while (!connected) {
			++attempts;
			web3Instance = web3Tools.init.instantiate();

			if (attempts == 1) {
				console.dir(web3Instance.network);
			}

			try {
				debug.d(`Attempting Web3 connection on network ${web3Instance.network.id} ...`);
				let networkId = await web3Instance.web3.eth.net.getId();
				debug.d(`... connected to ${networkId}`);

				if (networkId != web3Instance.network.id) {
					throw new Error(
						`... got ${networkId}, but expected ${web3Instance.network.id}`
					);
				}

				connected = true;
			} catch (error) {
				debug.error('Encountered error trying to instantiate new Web3 instance ...');
				debug.error('... ', error);
			}

			if (!connected) {
				if (attempts >= maxAttempts) {
					debug.d(`FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`);
					return false;
				}
				await timeoutPromise(3000);
			}
		}

		const { web3, network, account } = web3Instance;
		self.web3 = web3;
		self.network = network;
		self.address = account;

		debug.d('... Web3 connection success');
		return true;
	}

	initContract() {
		const self = this;
		self.oracle = new self.web3.eth.Contract(
			self.oracleInterface.abi,
			self.oracleInterface.networks[self.network.id].address
		);
	}

	async checkConnection() {
		const self = this;
		const maxAttempts = 3;
		let attempts = 0;
		let connected = false;
		let networkId;

		debug.d('Checking Web3 connection ...');
		while (!connected) {
			attempts += 1;
			try {
				networkId = await self.web3.eth.net.getId();
				connected = true;
			} catch (error) {
				debug.d('... ERROR: ', error);
			}

			if (!connected) {
				if (attempts < maxAttempts) {
					await timeoutPromise(2000);
				} else {
					await self.initWeb3();
					self.initContract();
					attempts = 0;
				}
			}
		}
	}

	async start() {
		const self = this;

		// Initialise clients
		await self.initWeb3();
		let callbackAccount = self.address;
		if (!callbackAccount) {
			callbackAccount = self.web3.eth.defaultAccount;
		}
		debug.d(`Using callback account: ${callbackAccount}`);
		debug.d(`Connecting to Oracle contract ...`);
		self.initContract();
		debug.d(`Initialising twitter client ...`);
		await twitter.initClient();

		let txOpts = {
			gas: self.network.gasLimit,
			gasPrice: self.network.gasPrice,
			common: self.network.defaultCommon,
		};

		const handleQuery = async (query) => {
			let success = false;
			let attempts = 3;
			while (!success && attempts > 0) {
				try {
					await handleFindTweet(self.director, self.network)(
						callbackAccount,
						self.oracle,
						query,
						txOpts
					);
					success = true;
				} catch (error) {
					debug.error('Failed to handle query: ', error);
					console.log(error);
				}

				if (!success) {
					--attempts;
					// Reinstantiate web3
					await self.initWeb3();
					self.initContract();
					timeoutPromise(5000);
				}
			}
		};

		await self.processWaitingQueries(self.oracle, handleQuery);

		debug.d(`Subscribing to oracle requests ...`);
		self.subscribeLogEvent(self.oracle, 'FindTweetLodged', handleQuery);
	}

	async processWaitingQueries(contract, handleFunc) {
		let opts = { fromBlock: 0 };
		let responseMap = {};
		debug.d(`Finding waiting queries ...`);
		const [queryEvents, responseEvents] = await Promise.all([
			contract.getPastEvents('FindTweetLodged', opts),
			contract.getPastEvents('TweetStored', opts).then((events) => {
				events.forEach((event) => (responseMap[event.returnValues.queryId] = event));
				return events;
			}),
		]);
		debug.d(`\tQueries: ${queryEvents.length}, Responses: ${responseEvents.length}`);

		let pendingResponses = [];
		queryEvents.forEach((event) => {
			const query = event.returnValues;
			if (!responseMap[query.queryId]) {
				pendingResponses.push(handleFunc(query));
			}
		});

		debug.d(`Responding to ${pendingResponses.length} queries ...`);
		let r = await Promise.all(pendingResponses);

		return;
	}

	subscribeLogEvent(contract, eventName, handleFunc) {
		const self = this;
		const eventJsonInterface = self.web3.utils._.find(
			contract._jsonInterface,
			(o) => o.name === eventName && o.type === 'event'
		);

		// Handle subscription data
		const handleUpdate = (error, result) => {
			if (!error) {
				const eventObj = self.web3.eth.abi.decodeLog(
					eventJsonInterface.inputs,
					result.data,
					result.topics.slice(1)
				);
				//debug.ei(`${eventName}:`, eventObj)
				handleFunc(eventObj);
			} else {
				debug.error(error);
			}
		};

		const subscription = self.web3.eth.subscribe(
			'logs',
			{
				address: contract.options.address,
				topics: [eventJsonInterface.signature],
			},
			handleUpdate
		);

		self.subscribedEvents[eventName] = subscription;

		// Pre-empt websocket timeout (60 mins on infura)
		setInterval(() => {
			self.checkConnection().then(() => {
				debug.d(`... resubscribed ${eventName}`);
				self.subscribedEvents[eventName].subscribe(handleUpdate);
			});
		}, DEFAULT_WATCHDOG_INTERVAL);

		debug.name('Subscriber', `Subscribed to ${eventName}.`);
	}

	async stop() {
		const self = this;
		await Promise.all(
			Object.keys(self.subscribedEvents).map(
				(eventName) =>
					new Promise((resolve, reject) =>
						self.subscribedEvents[eventName].unsubscribe((error, succ) => {
							if (error) {
								console.error(`Failed to unsubscribe from '${eventName}'`);
								reject(error);
							}
							debug.d(`... unsubscribed '${eventName}'`);
							resolve(succ);
						})
					)
			)
		);
		debug.d('Unsubscribed and stopped.');
	}
}

const handleFindTweet = (director, network) => async (
	account,
	contract,
	query,
	txOpts
) => {
	// TODO: should try here until the tweet is found, or maxAttempts reached
	const retryInterval = 2000;
	const maxAttempts = 5;

	let opts = {
		...txOpts,
		from: account,
	};

	const qid = query.queryId;
	const abr = qid.slice(0, 8) + qid.slice(qid.length - 9, qid.length); // abridged qid

	// Human readable log
	let userData = {};
	try {
		userData = await twitter.getUserData(query.userId);
		//console.log(userData);
	} catch (error) {
		debug.error(error);
	}

	debug.h(`Got query ${userData.handle}:${query.userId}, queryId: ${qid}, `);
	//let tweet = await twitter.findClaimTweet(query.userId);
	let tweets = await twitter.searchClaimTweets(userData.handle);
	if (tweets.length < 1) {
		throw new Error('No claim tweet found');
	}

	let tweet = tweets[0].full_text;
	debug.name(abr, `Found tweet: ${tweet}`);

	let claimString = tweet.split(' ')[0] + ' ' + tweet.split(' ')[1];
	let followersCountHex = web3Tools.utils.uInt32ToHexString(userData.followers_count);
	console.log(`Followers count: ${userData.followers_count}, ${followersCountHex}`);
	claimString += `:${followersCountHex}`;
	debug.name(abr, `Claim string: ${claimString}`);
	debug.name(abr, `Len: ${claimString.length}`);

	let getNonce = await block(director.a_nonce, {
		type: 'get_nonce',
		account,
		network: network,
	});

	opts.nonce = getNonce.result;

	let r = await contract.methods
		.__callback(
			qid,
			claimString, // query result
			'0x0' // proof
		)
		.send(opts);

	debug.name(abr, 'Query response sent.');
	return r;
};

module.exports = TinyOracle;

// Example usage
if (debug.control.enabled() && require.main === module) {
	var argv = process.argv.slice(2);
	if (argv.test) {
	}

	const RETRY_DELAY = 3000;
	const MAX_ATTEMPTS = 5;
	const director = bootstrap();
	const a_web3 = director.start_actor(
		'web3',
		Web3(undefined, MAX_ATTEMPTS, {
			retryDelay: RETRY_DELAY,
		})
	);
	let a_nonce = director.start_actor('nonce', nonce, { a_web3 });

	director.a_nonce = a_nonce;

	(async () => {
		let networkId;
		//while(networkId != network.id) {
		// Work around if using web3-provider-engine
		//	networkId = await web3.eth.net.getId();
		//	debug.d('Web3 provider returned network ID: ', networkId);
		//}

		let oracleServer = new TinyOracle({}, { director }); //web3, undefined, account, network);
		await oracleServer.start();

		setTimeout(async () => {
			//await oracleServer.stop();
		}, 1000);
	})();
}
