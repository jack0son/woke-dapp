const {
	Logger,
	web3Tools,
} = require('@woke/lib');
const debug = Logger('cli');

const getEvents = contractInstance => async (eventName, filter) => {
	let opts = {
		fromBlock: 0,
	}
	let events = await contractInstance.getPastEvents(eventName, opts);
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

async function initWeb3() {

	let web3Instance;
	const maxAttempts = 5;
	let attempts = 0;

	let connected = false;

	while(!connected) {
		++attempts
		web3Instance = web3Tools.init.instantiate();

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

function initContract(web3Instance, artifact) {
	const address = artifact.networks[web3Instance.network.id].address;
	debug.d(`Initialising ${artifact.contractName} at ${address}`);
	return  new web3Instance.web3.eth.Contract(artifact.abi, address);
}

function nonEmptyString(str) {
	return str !== undefined && str !== null && str.length && str.length > 0;
}

module.exports = { getEvents, checkConnection, initWeb3, initContract, nonEmptyString };
