const { spawnStateless, dispatch, query } = require('nact');
const { bootstrap, start_actor } = require('./actor-system');
const PersistenceEngine = require('./persistence-engine');
const { tipper, TwitterMonitor, polling, nonce, Tweeter } = require('./actors');

// Lib
const { create_woken_contract_actor } = require('./lib/actors/woken-contract');
const TwitterStub = require('./lib/twitter-stub');
const twitterMock = require('../test/mocks/twitter-client');
const loadContract = require('./lib/contracts').load;
const debug = require('@woke/lib').Logger('sys_tip');

function TwitterClient() {
	return twitterMock.createMockClient(3);
}

class TipSystem {
	constructor(a_wokenContract, opts) {
		const { twitterStub, persist, pollingInterval, notify} = opts;
		this.persist = persist ? true : false;
		this.config = {
			TWITTER_POLLING_INTERVAL: pollingInterval || 100*1000,
		};
		this.twitterStub = opts.twitterStub || new TwitterStub(TwitterClient())

		// Persistence
		if(this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine()
		} else {
			debug.warn(`Persistence not enabled.`);
		}

		this.director = this.persist ? bootstrap(this.persistenceEngine) : bootstrap();
		const director = this.director;

		// Actors
		this.a_wokenContract = a_wokenContract ||
			create_woken_contract_actor(director, {persist: this.persist});

		if(notify) {
			this.a_tweeter = director.start_actor('tweeter', Tweeter(this.twitterStub));
		}

		this.a_tipper = this.persist ? 
			director.start_persistent('tipper', tipper, {
				a_wokenContract: this.a_wokenContract,
				a_tweeter: this.a_tweeter,
			}) :
			director.start_actor('tipper', tipper, {
				a_wokenContract: this.a_wokenContract,
				a_tweeter: this.a_tweeter,
			});


		this.a_tMon = director.start_actor('twitter_monitor', TwitterMonitor(this.twitterStub));
		this.a_polling = director.start_actor('polling_service', polling);

		// Forward twitter monitor messages to tipper
		this.a_tweetForwarder = spawn_tweet_forwarder(this.a_polling, this.a_tipper);
	}

	async start() {
		const self = this;

		if(self.persist) {
			try {
				await self.persistenceEngine.db.then(db => db.connect())
			} catch(error) {
				throw error;
			}
		}

		dispatch(self.a_tipper, { type: 'resume' });

		dispatch(self.a_polling, { type: 'poll',
			target: self.a_tMon,
			action: 'find_tips',
			period: self.config.TWITTER_POLLING_INTERVAL,
			msg: { a_polling: self.a_polling },
		}, self.a_tweetForwarder);

		console.log(`Started tip system.`);
	}
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

// Mock tip system
if(debug.control.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	const [persist, ...args] = argv;

	(async () => {
		const twitterStub = new TwitterStub(TwitterClient());
		const tipSystem = new TipSystem(undefined, { persist: false });
		tipSystem.start();
	})()
}
