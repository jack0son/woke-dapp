const { spawnStateless, dispatch, query } = require('nact');
const { bootstrap, start_actor } = require('./actor-system');
const PersistenceEngine = require('./persistence-engine');
const { notifier, tweeter  } = require('./actors');

// Lib
const TwitterStub = require('./lib/twitter-stub');
const twitterMock = require('../test/mocks/twitter-client');
const debug = require('@woke/lib').Logger('sys_tip');

function TwitterClient() {
	return twitterMock.createMockClient(3);
}

class NotificationSystem {
	constructor(a_wokenContract, opts) {
		const { twitterStub, persist } = opts;
		this.persist = persist ? true : false;
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
		this.a_wokenContract = a_wokenContract || create_woken_contract_actor(director);
		this.a_tweeter = director.start_actor('tweeter', Tweeter(this.twitterStub));
		this.a_notifier = this.persist ? 
			director.start_persistent('notifier', notifier, {
				a_wokenContract: this.a_wokenContract,
				a_tweeter: this.a_tweeter,
			}) :
			director.start_actor('notifier', notifier, {
				a_wokenContract: this.a_wokenContract,
				a_tweeter: this.a_tweeter,
			});
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

		dispatch(self.a_notifier, { type: 'resume' });

		console.log(`Started transaction notification system.`);
	}
}
