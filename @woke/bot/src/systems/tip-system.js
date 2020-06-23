const { ActorSystem, PersistenceEngine, actors} = require('@woke/wact');
const { bootstrap,  dispatch, spawnStateless } = ActorSystem;
const { ContractsSystem } = require('@woke/web3-nact');
const { TwitterStub, Logger, mocks } = require('@woke/lib');
const { tipper, TwitterMonitor, Tweeter } = require('../actors');

const twitterMock = mocks.twitterClient;
const debug = Logger('sys_tip');

function TwitterClient() {
	return twitterMock.createMockClient(3);
}

class TipSystem {
	constructor(contracts, opts) {
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
		this.contracts = contracts ||
			ContractsSystem(director, ['UserRegistry'],  {persist: this.persist});

		if(notify) {
			this.a_tweeter = director.start_actor('tweeter', Tweeter(this.twitterStub));
		}

		this.a_tipper = director[this.persist ? 'start_persistent' : 'start_actor'](
			'tipper', // name
			tipper,		// actor definition
			{					// initial state
				a_wokenContract: this.contracts.UserRegistry,
				a_tweeter: this.a_tweeter,
			}
		);

		this.a_tMon = director.start_actor('twitter_monitor', TwitterMonitor(this.twitterStub));
		this.a_polling = director.start_actor('polling_service', actors.Polling);

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
