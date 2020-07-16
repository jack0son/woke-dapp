const { ActorSystem, PersistenceEngine } = require('@woke/wact');
const { bootstrap,  dispatch } = ActorSystem;
const { MonitorSystem, tweeter: { Tweeter } } = require('@woke/actors');
const { ContractsSystem } = require('@woke/web3-nact');
const { TwitterStub, Logger, mocks } = require('@woke/lib');
const { notifier  } = require('../actors');

const twitterMock = mocks.twitterClient;
const debug = Logger('sys_notify');

function TwitterClient() {
	return twitterMock.createMockClient(3);
}

class NotificationSystem {
	constructor(contracts, opts) {
		const defaults = {
			monitoring: true,
		};
		const { twitterStub, persist, networkList, monitoring } = { ...defaults, ...opts };
		this.persist = persist ? true : false;
		this.twitterClient = TwitterClient();
		this.twitterStub = opts.twitterStub || new TwitterStub(this.twitterClient)
		this.config = { networkList, monitoring }; 

		// Persistence
		if(this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine()
		} else {
			debug.warn(`Persistence not enabled.`);
		}

		this.director = this.persist ? bootstrap(this.persistenceEngine) : bootstrap();
		const director = this.director;

		if(this.config.monitoring) {
			this.monitorSystem = MonitorSystem({ twitterClient: this.twitterClient, director });
		}

		// Actors
		this.contracts = contracts || ContractsSystem(director, ['UserRegistry'], {
				persist: this.persist,
				networkList: this.config.networkList,
		});
		this.a_tweeter = director.start_actor('tweeter', Tweeter(this.twitterStub));

		this.a_notifier = director[this.persist ? 'start_persistent' : 'start_actor'](
			'notifier',	// name
			notifier,		// actor definition
			{						// initial state
				a_contract_UserRegistry: this.contracts.UserRegistry,
				a_tweeter: this.a_tweeter,
				a_monitor: this.monitorSystem ? this.monitorSystem.a_monitor : undefined,
			}
		);
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

		dispatch(self.a_notifier, { type: 'init' });

		console.log(`Started transaction notification system.`);
	}
}

module.exports = NotificationSystem;

// Mock notification system
if(debug.control.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	const [persist, ...args] = argv;

	const { twitter } = require('@woke/lib');

	(async () => {
		await twitter.initClient();
		const twitterStub = new TwitterStub(twitter);

		const notiSystem = new NotificationSystem(undefined, {
			persist,
			twitterStub,
		});
		notiSystem.start();

	})()
}
