const { Logger, twitter, TwitterDomain, configure } = require('@woke/lib');
const { ActorSystem } = require('@woke/wact');
const { Service, extensions } = require('@woke/service');
const { ContractSystem } = require('@woke/web3-nact');

// Actors
const TwitterAgent = require('./actors/twitter-agent');
const Oracle = require('./actors/oracle');

const defaults = {
	name: 'sys_oracle',
	maxProviderConnectionAttempts: 'unset',
	retryInterval: 15000 * 3,
	subscriptionWatchdogInterval: 15000 * 10,
};
const debug = Logger(defaults.name);

class OracleSystem extends Service {
	constructor(opts) {
		super(opts, defaults, [
			extensions.contractSystem(ContractSystem)(
				['TwitterOracleMock'],
				opts.contractInstances,
				{ maxAttempts: 2 }
			),
			extensions.twitterDomain,
		]);
		const director = this.director;

		// Actors
		this.a_twitterAgent = director.start_actor(
			'twitterAgent',
			TwitterAgent(this.twitterDomain)
		);

		this.a_oracle = director[this.persistent ? 'start_persistent' : 'start_actor'](
			'oracle',
			Oracle({ twitterClient: this.twitterClient }),
			{
				a_contract_TwitterOracle: this.contractSystem.TwitterOracleMock,
				a_twitterAgent: this.a_twitterAgent,
				subscriptionWatchdogInterval: this.config.resubscribeInterval,
			}
		);
	}

	async start() {
		const _this = this;
		await _this.init();

		ActorSystem.dispatch(_this.a_oracle, { type: 'init' });
		console.log(`Started oracle system.`);
	}
}

module.exports = OracleSystem;
