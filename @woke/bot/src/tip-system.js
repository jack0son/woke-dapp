const { spawnStateless, dispatch, query } = require('nact');
const { bootstrap, start_actor} = require('./actor-system');
const PersistenceEngine = require('./persistence-engine');
const { tipper, TwitterMonitor, polling, contract, Web3 } = require('./actors');

// Lib
const TwitterStub = require('./lib/twitter-stub');
const loadContract = require('./lib/contracts').load;
const debug = require('@woke/lib').Logger('sys_tip');

function TwitterClient() {
}

// Will be initialised by bot system and passed a common wokenContract actor
class TipSystem {
	constructor(a_wokenContract, opts) {
		const { twitterStub, persist, pollingInterval} = opts;
		this.persist = persist ? true : false;
		this.config = {
			TWITTER_POLLING_INTERVAL: pollingInterval || 100*1000,
		};
		this.twitterStub = opts.twitterStub || TwitterStub(TwitterClient())

		if(this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine()
		}

		this.director = this.persist ? bootstrap(this.persistenceEngine) : bootstrap();
		const director = this.director;

		// Actors
		this.a_wokenContract = a_wokenContract || create_woken_contract_actor(director);
		this.a_tipper = this.persist ? 
			director.start_persistent('tipper', tipper, {
				a_wokenContract: this.a_wokenContract,
			}) :
			director.start_actor('tipper', tipper, {
				a_wokenContract: this.a_wokenContract,
			});

		this.a_tMon = director.start_actor('twitter_monitor', TwitterMonitor(this.twitterStub));
		this.a_polling = director.start_actor('polling_service', polling);

		// Forward twitter monitor messages to tipper
		this.a_tweetForwarder = spawn_tweet_forwarder(this.a_polling, this.a_tipper);
	}

	async start() {
		const self = this;
		const { a_wokenContract, director } = self;

		if(self.persist) {
			try {
				await self.persistenceEngine.db.then(db => db.connect())
			} catch(error) {
				throw error;
			}
		}

		dispatch(self.a_polling, { type: 'poll',
			target: self.a_tMon,
			action: 'find_tips',
			period: self.config.TWITTER_POLLING_INTERVAL,
		}, self.a_tweetForwarder);

		console.log(`Started tip system.`);
	}
}

function create_woken_contract_actor(director) {
	const MAX_ATTEMPTS = 5;
	const RETRY_DELAY = 400;
	debug.warn(`No woken contract provided, initialising my own...`)
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

// Mock tip system
if(debug.debug.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	const [persist, ...args] = argv;

	const tipSystem = new TipSystem(undefined, { persist });
	tipSystem.start();
}

// Forward tips to the tipper
function spawn_tweet_forwarder(parent, a_tipper) {
	return spawnStateless(
		parent,
		(msg, ctx) => {
			switch(msg.type) {
				case 'new_tips': {
					const { tips } = msg;
					tips.forEach(tip => dispatch(a_tipper, {type: 'tip', tip}));
					break;
				}

				default: {
					console.log(`Forwarder got unknown msg `, msg);
				}
			}
		}
	);
}

module.exports = TipSystem;
