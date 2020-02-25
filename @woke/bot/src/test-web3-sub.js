const { spawnStateless, dispatch, query } = require('nact');
const { Web3, contract } = require('./actors');
const subscriberActor = require('./actors/subscriber');

const { bootstrap, start_actor, block } = require('./actor-system');


const loadContract = require('./lib/contracts').load;
const debug = require('@woke/lib').Logger('sys_tip');

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

const filter = e => e.claimed == false;

const director = bootstrap();
const a_wokenContract = create_woken_contract_actor(director);

const a_catch_logs = spawnStateless(director.system,
	(msg, ctx) => {
		console.log(msg);
	},
	'logs',
);

(async () => {
	const filter = (event) => event.claimed == false;
	const { a_sub } = await query(a_wokenContract, { type: 'subscribe_log', eventName, filter }, 10*1000);
	//console.log(a_sub);
	dispatch(a_sub,  {type: 'start'}, a_catch_logs);
})()

