const {
	Logger,
	twitter,
	web3Tools,
} = require('woke-lib');
const Web3 = require('web3');
const debug = Logger('oracle');

const oracleMockInterface = require('../../contracts/build/contracts/TwitterOracleMock.json')

function timeoutPromise(ms) {
	return new Promise((resolve, reject) => setTimeout(() => {
		resolve();
	}, ms));
}

// @dev Minimal oracle server to respond to queries in the mock oracle contract.
class TinyOracle {
	constructor(web3, oracleInterface, address, network, opts) {
		this.address = address;
		this.oracleInterface = oracleMockInterface;
		this.network = network;
		this.web3 = web3;
		this.subscribedEvents = {};

		if(opts) {
			twitter = opts.twitter;
		} 
	}

	async initWeb3() {
		const self = this;

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
				debug.m(`Attempting Web3 connection on network ${web3Instance.network.id} ...`);
				let networkId = await web3Instance.web3.eth.net.getId();
				debug.m(`... connected to ${networkId}`);

				if(networkId != web3Instance.network.id) {
					throw new Error(`... got ${networkId}, but expected ${web3Instance.network.id}`);
				}

				connected = true;

			} catch (error) {
				debug.err('Encountered error trying to instantiate new Web3 instance ...');
				debug.err('... ', error);
			}

			if(!connected) {
				if(attempts >= maxAttempts) {
					debug.m(`FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`);
					return false;
				}
				await timeoutPromise(3000);
			}
		}

		const {web3, network, account} = web3Instance;
		self.web3 = web3;
		self.network = network;
		self.address = account;

		debug.m('... Web3 connection success');
		return true;
	}

	initContract() {
		const self = this;
		self.oracle = new self.web3.eth.Contract(self.oracleInterface.abi, self.oracleInterface.networks[self.network.id].address);
	}

	async checkConnection() {
		const self = this;
		const maxAttempts = 3;
		let attempts = 0;
		let connected = false;
		let networkId;

		debug.m('Checking Web3 connection ...');
		while(!connected) {
			attempts += 1;
			try {
				networkId = await self.web3.eth.net.getId();
				connected = true;
			} catch (error) {
				debug.m('... ERROR: ', error);
			}

			if(!connected) {
				if(attempts < maxAttempts) {
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
		if(!callbackAccount) {
			callbackAccount = web3.eth.defaultAccount;
		}
		debug.m(`Using callback account: ${callbackAccount}`);
		debug.m(`Connecting to Oracle contract ...`);
		self.initContract();
		debug.m(`Initialising twitter client ...`);
		await twitter.initClient();

		let txOpts = {
			gas: self.network.gasLimit,
			gasPrice: self.network.gasPrice,
			common: self.network.defaultCommon,
		};

		const handleQuery = async (query) => {
			let success = false;
			while(!success) {
				try {
					await handleFindTweet(callbackAccount, self.oracle, query, txOpts);
					success = true;
				} catch(error) {
					debug.err('Failed to handle query: ', error);
				}

				if(!success) {
					// Reinstantiate web3
					await self.initWeb3();
					self.initContract();
					timeoutPromise(5000);
				}
			}
		}

		await self.processWaitingQueries(self.oracle, handleQuery);

		debug.m(`Subscribing to oracle requests ...`);
		self.subscribeLogEvent(
			self.oracle, 
			'FindTweetLodged', 
			handleQuery
		);
	}

	async processWaitingQueries(contract, handleFunc) {
		let opts = {fromBlock: 0};
		let responseMap = {};
		debug.m(`Finding waiting queries ...`);
		const [queryEvents, responseEvents] = await Promise.all([
			contract.getPastEvents('FindTweetLodged', opts),
			contract.getPastEvents('TweetStored', opts).then(events => {
				events.forEach(event => responseMap[event.returnValues.queryId] = event);
				return events;
			})
		]);
		debug.m(`\tQueries: ${queryEvents.length}, Responses: ${responseEvents.length}`);
		
		let pendingResponses = [];
		queryEvents.forEach(event => {
			const query = event.returnValues;
			if(!responseMap[query.queryId]) {
				pendingResponses.push(handleFunc(query));
			}
		});

		debug.m(`Responding to ${pendingResponses.length} queries ...`);
		let r = await Promise.all(pendingResponses);

		return;
	}

	subscribeLogEvent (contract, eventName, handleFunc) {
		const self = this;
		const eventJsonInterface = self.web3.utils._.find(
			contract._jsonInterface,
			o => o.name === eventName && o.type === 'event',
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
				debug.err(error);
			}
		}

		const subscription = self.web3.eth.subscribe('logs', {
			address: contract.options.address,
			topics: [eventJsonInterface.signature]
		}, handleUpdate);

		self.subscribedEvents[eventName] = subscription;

		// Pre-empt websocket timeout (60 mins on infura)
		setInterval(() => {
			self.checkConnection().then(() => {
				debug.m(`... resubscribed ${eventName}`)
				self.subscribedEvents[eventName].subscribe(handleUpdate);
			});
		}, 10*60*1000);

		debug.name('Subscriber', `Subscribed to ${eventName}.`);
	}

	async stop() {
		const self = this;
		await Promise.all(Object.keys(self.subscribedEvents)
			.map(eventName => new Promise((resolve, reject) =>
				self.subscribedEvents[eventName].unsubscribe((error, succ) => {
					if(error) {
						console.error(`Failed to unsubscribe from '${eventName}'`);
						reject(error);
					}
					debug.m(`... unsubscribed '${eventName}'`);
					resolve(succ);
				})
			))
		);
		debug.m('Unsubscribed and stopped.');
	}
}

const handleFindTweet = async (account, contract, query, txOpts) => {
	// TODO: should try here until the tweet is found, or maxAttempts reached
	const retryInterval = 2000;
	const maxAttempts = 5;

	let opts = {
		...txOpts,
		from: account
	};
	
	const id = query.queryId;
	const abr = id.slice(0,8) + id.slice(id.length-9, id.length) // abridged id
	debug.h(`Got query handle:${query.handle}, id:${query.queryId}, `);
	let tweet = await twitter.findClaimTweet(query.userId);
	debug.name(abr, `Found tweet: ${tweet}`);

	const claimString = tweet.split(' ')[0] + ' ' + tweet.split(' ')[1]
	debug.name(abr, `Claim string: ${claimString}`);

	let r = await contract.methods.__callback(
		query.queryId,
		claimString,		// query result
		'0x0',					// proof
	).send(opts);

	debug.name(abr, 'Query response sent.');
	return r;
}

module.exports = TinyOracle;

// Example usage
if(debug.debug.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	if(argv.test) {

	}


	(async () => {


		let networkId;
		//while(networkId != network.id) {
			// Work around if using web3-provider-engine
		//	networkId = await web3.eth.net.getId();
		//	debug.m('Web3 provider returned network ID: ', networkId);
		//}

		let oracleServer = new TinyOracle() //web3, undefined, account, network);
		await oracleServer.start();

		setTimeout(async () => {
			//await oracleServer.stop();
		}, 1000);
	})();
}

