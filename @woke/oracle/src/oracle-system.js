const { Logger, twitter, TwitterStub } = require('@woke/lib');
const { ActorSystem, PersistenceEngine } = require('@woke/wact');
const { ContractsSystem } = require('@woke/web3-nact');

const TwitterAgent = require('./actors/twitter-agent');
const twitterMock = require('../test/mocks/twitter-stub.mock');
const Oracle = require('./actors/oracle');

const debug = Logger('sys_oracle');

function TwitterClient() {
	return twitterMock.createMockClient(3);
}

class OracleSystem {
	constructor(contracts, opts) {
		const { twitterClient, persist, retryInterval, subscriptionWatchdogInterval, persistenceConfig, networkList } = opts;
		this.persist = !!persist;
		this.config = {
			QUERY_RETRY_INTERVAL: retryInterval || 15000*3,
			SUBSCRIPTION_WATCHDOG_INTERVAL: subscriptionWatchdogInterval || 15000*10,
			persistenceConfig,
			networkList,
		};
		//this.twitterStub = opts.twitterStub || new TwitterStub(TwitterClient())
		this.twitterStub = new TwitterStub(twitterClient || TwitterClient())

		// Persistence
		if(this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine(this.config.persistenceConfig)
		} else {
			debug.warn(`Persistence not enabled.`);
		}

		this.director = ActorSystem.bootstrap(this.persist ? this.persistenceEngine : undefined);
		const director = this.director;

		// Actors
		this.contracts = contracts || ContractsSystem(director, ['TwitterOracleMock'],  {
				persist: this.persist,
				networkList: this.config.networkList,
		});

		this.a_twitterAgent = director.start_actor('twitterAgent', TwitterAgent(this.twitterStub));

		this.a_oracle = director[this.persist ? 'start_persistent' : 'start_actor']('oracle', Oracle, {
			a_contract_TwitterOracle: this.contracts.TwitterOracleMock,
			a_twitterAgent: this.a_twitterAgent,
			subscriptionWatchdogInterval: this.config.SUBSCRIPTION_WATCHDOG_INTERVAL,
		});
	}

	async start() {
		const self = this;

		if(self.persist) {
			try {
				await self.persistenceEngine.db.then(db => db.connect())
				debug.d(`Connected to persistence repository.`);
			} catch(error) {
				throw error;
			}
		}

		ActorSystem.dispatch(self.a_oracle, { type: 'init' });

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
