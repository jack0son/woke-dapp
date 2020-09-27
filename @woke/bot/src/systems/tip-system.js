const { ActorSystem, PersistenceEngine, actors } = require('@woke/wact');
const { bootstrap, dispatch, spawnStateless } = ActorSystem;
const {
	useMonitor,
	tweeter: { Tweeter },
} = require('@woke/actors');
const { ContractSystem } = require('@woke/web3-nact');
const { TwitterDomain, twitter, Logger, configure } = require('@woke/lib');
const configureLogger = require('../config/logger-config');
const { TipSupervisor, TwitterMonitor } = require('../actors');
const { TwitterEnvironment } = require('../config/twitter-config');

const debug = Logger('sys_tip');
const LOGGER_STRING = 'actor*,-*:twitter_monitor*,-*:_tip-*:info';
const VERBOSE_LOGGER_STRING = 'actor*,-*:twitter_monitor*,-*:_tip-*:info';

const chooseTwitterClient = (twitterEnv) => {
	switch (twitterEnv) {
		case 'fake':
			return twitter.fake.FakeClient(1, {});
		case 'development':
		case 'staging':
			return twitter.client;
	}
};

const defaults = {
	faultMonitoring: true,
	persist: false,
	pollingInterval: 5 * 1000,
	notificationTweets: true,
};

class TipSystem {
	constructor(opts) {
		const {
			contractSystem,
			persist,
			pollingInterval,
			notificationTweets,
			networkList,
			faultMonitoring,
			twitterEnv,
			verbose,
			...conf
		} = configure(opts, defaults);

		if (verbose) configureLogger({ enableString: VERBOSE_LOGGER_STRING });

		this.persist = persist ? true : false;
		this.config = {
			TWITTER_POLLING_INTERVAL: pollingInterval || 100 * 1000,
			networkList,
			faultMonitoring,
		};
		this.twitterClient = TwitterEnvironment(twitterEnv).client;
		this.twitterDomain = new TwitterDomain(this.twitterClient);

		if (this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine();
		} else {
			debug.warn(`Persistence not enabled.`);
		}

		this.director = this.persist ? bootstrap(this.persistenceEngine) : bootstrap();
		const director = this.director;

		// Initialise monitor using own actor system and twitter client
		this.monitor = useMonitor({
			twitterClient: this.twitterClient,
			director,
			enabled: this.config.faultMonitoring,
		});

		// Actors
		this.contractSystem =
			contractSystem ||
			ContractSystem(director, ['UserRegistry'], {
				persist: this.persist,
				networkList: this.config.networkList,
			});

		if (notificationTweets) {
			this.a_tweeter = director.start_actor('tweeter', Tweeter(this.twitterDomain));
		}

		this.a_tipManager = director[this.persist ? 'start_persistent' : 'start_actor'](
			'tip-supervisor', // name
			TipSupervisor(this.contractSystem.UserRegistry, this.a_tweeter)
		);

		this.a_tMon = director.start_actor(
			'twitter_monitor',
			TwitterMonitor(this.twitterDomain),
			{}
		);
		this.a_polling = director.start_actor('polling_service', actors.Polling);

		// Forward twitter monitor messages to tipper
		this.a_tweetForwarder = spawn_tweet_forwarder(this.a_polling, this.a_tipManager);
	}

	async start() {
		const self = this;

		await self.twitterDomain.init();

		if (self.persist) {
			try {
				await self.persistenceEngine.db.then((db) => db.connect());
			} catch (error) {
				throw error;
			}
		}

		dispatch(self.a_tipManager, { type: 'restart' });

		// Poll twitter API for new tips
		dispatch(
			self.a_polling,
			{
				type: 'poll',
				target: self.a_tMon,
				action: 'find_tips',
				period: self.config.TWITTER_POLLING_INTERVAL,
				msg: { a_polling: self.a_polling },
			},
			self.a_tweetForwarder
		);

		console.log(`Started tip system.`);
	}
}

// Forward tips to the tipper
function spawn_tweet_forwarder(parent, a_tipManager) {
	return spawnStateless(parent, (msg, ctx) => {
		switch (msg.type) {
			case 'new_tips': {
				const { tips } = msg;
				tips.forEach((tip) => dispatch(a_tipManager, { type: 'submit', task: tip }));
				break;
			}

			default: {
				console.log(`Forwarder got unknown msg `, msg);
			}
		}
	});
}

module.exports = TipSystem;
