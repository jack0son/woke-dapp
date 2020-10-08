const { ActorSystem, actors } = require('@woke/wact');
const { Service } = require('@woke/service');
const { dispatch, spawnStateless, block } = ActorSystem;
const {
	tweeter: { Tweeter },
} = require('@woke/actors');
const { ContractSystem } = require('@woke/web3-nact');
const { TwitterDomain, twitter, Logger, configure } = require('@woke/lib');
const { TwitterClient } = require('@woke/lib/config/twitter-config');
const configureLogger = require('../config/logger-config');
const { TipSupervisor, TwitterMonitor } = require('../actors');

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
	name: 'sys_tip',
	faultMonitoring: false,
	persist: false,
	pollingInterval: 100 * 1000,
	notificationTweets: true,
	contractInstances: {},
	// contractSystem,
	// persist,
	// pollingInterval,
	// notificationTweets,
	// networkList,
	// faultMonitoring,
	// twitterClient: tiwt,
	// verbose,
};

const contractSytstemExtension = (conf) => (system) => {
	system.contractSystem =
		conf.contractSystem ||
		ContractSystem(system.director, ['UserRegistry'], conf.contractInstances, {
			persist: system.persist,
			networkList: conf.networkList,
		});
};

const twitterDomainExtension = (conf) => (system) => {
	system.twitterClient = conf.twitterClient || TwitterClient(conf.twitterEnv).client;
	system.twitterDomain = new TwitterDomain(system.twitterClient);
	system.initializers.push(() => system.twitterDomain.init());
};

class TipSystem extends Service {
	constructor(opts) {
		super(opts, defaults, [contractSytstemExtension, twitterDomainExtension]);
		const director = this.director;

		// Actors
		if (this.config.notificationTweets) {
			this.a_tweeter = director.start_actor('tweeter', Tweeter(this.twitterDomain));
		}

		this.a_tipSupervisor = director[this.persist ? 'start_persistent' : 'start_actor'](
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
		this.a_tweetForwarder = spawn_tweet_forwarder(this.a_polling, this.a_tipSupervisor);
	}

	getDirector() {
		return this.director;
	}

	setTweeter(a_tweeter) {
		return block(this.a_tipSupervisor, { type: 'setTweeter', a_tweeter });
	}

	async start() {
		const self = this;

		await self.init();

		dispatch(self.a_tipSupervisor, { type: 'restart' });

		// Poll twitter API for new tips
		dispatch(
			self.a_polling,
			{
				type: 'poll',
				target: self.a_tMon,
				action: 'find_tips',
				period: self.config.pollingInterval,
				msg: { a_polling: self.a_polling },
			},
			self.a_tweetForwarder
		);

		console.log(`Started tip system.`);
	}
}

// Forward tips to the tipper
function spawn_tweet_forwarder(parent, a_tipSupervisor) {
	return spawnStateless(parent, (msg, ctx) => {
		switch (msg.type) {
			case 'new_tips': {
				const { tips } = msg;
				tips.forEach((tip) => dispatch(a_tipSupervisor, { type: 'submit', task: tip }));
				break;
			}

			default: {
				console.log(`Forwarder got unknown msg `, msg);
			}
		}
	});
}

module.exports = TipSystem;
