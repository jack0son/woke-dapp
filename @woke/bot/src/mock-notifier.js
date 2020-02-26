
const { spawnStateless, dispatch, query } = require('nact');
const { Web3, contract } = require('./actors');
const notifierActor = require('./actors/notifier');
const TweeterActor = require('./actors/tweeter');

const { bootstrap, start_actor, block } = require('./actor-system');

const loadContract = require('./lib/contracts').load;
const debug = require('@woke/lib').Logger('sys_tip');

const TwitterStub = require('./lib/twitter-stub');
const twitterMock = require('../test/mocks/twitter-client');

const WokeToken = loadContract('WokeToken');

// Subscribe to transfer unclaimed events
// i.e. Tx where event.claimed = false
// @TODO subscription object could just be spawned by contract object

function create_woken_contract_actor(director) {
	const MAX_ATTEMPTS = 5;
	const RETRY_DELAY = 400;
	//	debug.warn(`No woken contract provided, initialising my own...`)
	const a_web3 = director.start_actor('web3', Web3(undefined, MAX_ATTEMPTS, {
		retryDelay: RETRY_DELAY,
	}));

	// Initialise Woken Contract agent
	const a_wokenContract = director.start_actor('woken_contract', contract, {
		a_web3, 
		contractInterface: loadContract('WokeToken'),
	})

	return a_wokenContract;
}

const eventName = 'Tx';

const opts = {
	fromBlock: 0,
}

const director = bootstrap();
const a_wokenContract = create_woken_contract_actor(director);
const twitterStub = new TwitterStub(twitterMock.createMockClient(5));
const a_tweeter = director.start_actor('tweeter', TweeterActor(twitterStub));

const a_notifier = director.start_actor('notifier', notifierActor, {
	a_wokenContract,
	a_tweeter,
});

dispatch(a_notifier, { type: 'init' });
