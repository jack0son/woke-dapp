const { Logger, twitter, TwitterDomain, configure } = require('@woke/lib');
const { ActorSystem, PersistenceEngine } = require('@woke/wact');
const { useMonitor } = require('@woke/actors');
const { ContractSystem } = require('@woke/web3-nact');

const { TwitterClient } = require('../config/twitter-config');
const debug = Logger('sys_oracle');

// const TwitterAgent = require('./actors/twitter-agent');
// const twitterMock = require('../test/mocks/twitter-stub.mock');
// const Oracle = require('./actors/oracle');
// function TwitterClient() {
// 	return twitterMock.createMockClient(3);
// }

class OracleSystem {
	constructor(opts) {
		const defaults = {
			monitoring: true,
		};

		const {
			contractSystem,
			twitterClient,
			persist,
			retryInterval,
			subscriptionWatchdogInterval,
			persistenceConfig,
			networkList,
			monitoring,
			oracleContractInstance,
		} = configure(opts, defaults);

		this.persist = !!persist;
		this.config = {
			QUERY_RETRY_INTERVAL: retryInterval || 15000 * 3,
			SUBSCRIPTION_WATCHDOG_INTERVAL: subscriptionWatchdogInterval || 15000 * 10,
			persistenceConfig,
			networkList,
			monitoring,
		};

		this.twitterClient = conf.twitterClient || TwitterClient(conf.twitterEnv).client;
		this.twitterDomain = new TwitterDomain(this.twitterClient);

		// Persistence
		if (this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine(this.config.persistenceConfig);
		} else {
			debug.warn(`Persistence not enabled.`);
		}

		this.director = ActorSystem.bootstrap(
			this.persist ? this.persistenceEngine : undefined
		);
		const director = this.director;

		if (!!this.config.monitoring) {
			// Initialise monitor using own actor system and twitter client
			this.monitor = useMonitor({ twitterClient: this.twitterClient, director });
		}

		const contractInstances = oracleContractInstance
			? { TwitterOracleMock: oracleContractInstance }
			: {};

		// Actors
		this.contractSystem =
			contractSystem ||
			ContractSystem(director, ['TwitterOracleMock'], contractInstances, {
				persist: this.persist,
				networkList: this.config.networkList,
				maxAttempts: 2,
			});

		this.a_twitterAgent = director.start_actor(
			'twitterAgent',
			TwitterAgent(this.twitterStub)
		);

		this.a_oracle = director[this.persist ? 'start_persistent' : 'start_actor'](
			'oracle',
			Oracle,
			{
				a_contract_TwitterOracle: this.contractSystem.TwitterOracleMock,
				a_twitterAgent: this.a_twitterAgent,
				subscriptionWatchdogInterval: this.config.SUBSCRIPTION_WATCHDOG_INTERVAL,
			}
		);
	}

	async start() {
		const self = this;

		if (self.persist) {
			try {
				await self.persistenceEngine.db.then((db) => db.connect());
				debug.d(`Connected to persistence repository.`);
			} catch (error) {
				throw error;
			}
		}

		ActorSystem.dispatch(self.a_oracle, { type: 'init' });
		console.log(`Started oracle system.`);
	}
}

module.exports = OracleSystem;

// Mock tip system
if (debug.control.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	const [persist, ...args] = argv;

	(async () => {
		const twitterStub = new TwitterDomain(twitterMock.createMockClient(5));
		const oracleSystem = new OracleSystem(undefined, { persist: false, twitterStub });
		oracleSystem.start();
	})();
}
