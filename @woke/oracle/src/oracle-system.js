const { Logger, twitter, TwitterStub } = require('@woke/lib');
const { ActorSystem, PersistenceEngine } = require('@woke/wact');
const { create_contracts_system } = require('@woke/actors');

const Oracle = require('./actors/oracle');

const twitterMock = require('../../lib/mocks/twitter-client');

const debug = Logger('sys_oracle');

// Lib
//const { create_woken_contract_actor } = require('./lib/actors/woken-contract');

function TwitterClient() {
	return twitterMock.createMockClient(3);
}

class OracleSystem {
	constructor(contracts, opts) {
		const { twitterStub, persist, retryInterval } = opts;
		this.persist = !!persist;
		this.config = {
			QUERY_RETRY_INTERVAL: retryInterval || 15000*3,
		};
		this.twitterStub = opts.twitterStub || new TwitterStub(TwitterClient())

		// Persistence
		if(this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine()
		} else {
			debug.warn(`Persistence not enabled.`);
		}

		this.director = ActorSystem.bootstrap(this.persist ? this.persistenceEngine : undefined);
		const director = this.director;

		// Actors
		this.contracts = contracts ||
			create_contracts_system(director, ['TwitterOracleMock'],  {persist: this.persist});

		this.a_oracle = director[this.persist ? 'start_persistent' : 'start_actor']('oracle', Oracle, {
			a_oracleContract: this.contracts.TwitterOracleMock,
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

		const dispatch = ActorSystem.dispatch;
		//dispatch(self.a_tipper, { type: 'resume' });

		//dispatch(self.a_polling, { type: 'poll',
		//	target: self.a_tMon,
		//	action: 'find_tips',
		//	period: self.config.TWITTER_POLLING_INTERVAL,
		//	msg: { a_polling: self.a_polling },
		//}, self.a_tweetForwarder);

		console.log(`Started oracle system.`);
	}
}

module.exports = OracleSystem;

// Mock tip system
if(debug.control.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	const [persist, ...args] = argv;

	(async () => {
		const twitterStub = new TwitterStub(twitterMock.createMockClient(5));
		//const twitterStub = new TwitterStub(TwitterClient());
		const oracleSystem = new OracleSystem(undefined, { persist: false, twitterStub });
		oracleSystem.start();
	})()
}
