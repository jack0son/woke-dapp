const { spawnStateless, dispatch, query } = require('nact');
const { Logger, twitter } = require('@woke/lib');
const { ActorSystem, PersistenceEngine } = require('@woke/wact');
const { create_contracts_system } = require('@woke/actors');

const { Oracle } = require('./actors/oracle');
const TwitterStub = require('./lib/twitter-stub');
const twitterMock = require('../test/mocks/twitter-client');

const debug = Logger('sys_oracle');

// Lib
//const { create_woken_contract_actor } = require('./lib/actors/woken-contract');
const TwitterStub = require('./lib/twitter-stub');
const twitterMock = require('../test/mocks/twitter-client');

function TwitterClient() {
	return twitterMock.createMockClient(3);
}

class OracleSystem {
	constructor(contracts, opts) {
		const { twitterStub, persist, retryInterval } = opts;
		this.persist = persist ? true : false;
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

		this.director = this.persist ? ActorSystem.bootstrap(this.persistenceEngine) : ActorSystem.bootstrap();
		const director = this.director;

		// Actors
		this.contracts = contracts ||
			create_contracts_system(director, ['UserRegistry'],  {persist: this.persist});

		const oracleArgs = ['oracle', Oracle, {
			a_oracleContract: this.contracts.MockTwitterOracle,
			a_tweeter: this.a_tweeter,
		}];

		this.a_oracle = this.persist ? 
			director.start_persistent(...oracleArgs)
			: director.start_actor(...oracleArgs);
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

		//dispatch(self.a_tipper, { type: 'resume' });

		//dispatch(self.a_polling, { type: 'poll',
		//	target: self.a_tMon,
		//	action: 'find_tips',
		//	period: self.config.TWITTER_POLLING_INTERVAL,
		//	msg: { a_polling: self.a_polling },
		//}, self.a_tweetForwarder);

		console.log(`Started tip system.`);
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


