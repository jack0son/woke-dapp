const { spawnStateless, dispatch, query } = require('nact');
const actorSystem = require('./actor-system');
const PersistenceEngine = require('./persistence-engine');
const { tipper, contract, Web3 } = require('./actors');

const loadContract = require('./lib/contracts').load;
const debug = require('@woke/lib').Logger('sys_tip');

// Will be initialised by bot system and passed a common wokenContract actor
class TipSystem {
	constructor(a_wokenContract, opts) {
		const { persist } = opts;

		self.director = persist ? bootstrap(PersistenceEngine()) : bootstrap()
		self.a_wokeContract = a_wokeContract || create_woken_contract_actor(self.director);
		self.a_tipper;
		self.a_tweetForwarder;
		self.a_twitterMonitor;
	}

	start() {
		const self = this;
		const { a_wokenContract, director } = self;

		console.log(`Started tip system.`);
	}
}

function create_woken_contract_actor(director) {
	const MAX_ATTEMPTS = 5;
	const RETRY_DELAY = 400;
	debug.warn(`No woken contract provided, initialising my own...`)
	const a_web3 = director.start_actor('web3', actors.Web3(undefined, MAX_ATTEMPTS, {
		retryDelay: RETRY_DELAY,
	}));

	// Initialise Woken Contract agent
	const a_wokenContract = director.start_actor('woken_contract', actors.contract, {
		a_web3, 
		contractInterface: wokeTokenInterface,
	})

	return a_wokenContract;
}

// Mock tip system
if(debug.debug.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	const [persist, ...args] = argv;

	const tipSystem = TipSystem(undefined, { persist });
	tipSystem.start();
}
