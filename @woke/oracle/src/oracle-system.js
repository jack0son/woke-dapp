const { Logger, twitter, TwitterDomain, configure } = require('@woke/lib');
const { ActorSystem } = require('@woke/wact');
const { Service, extensions } = require('@woke/service');
const { ContractSystem } = require('@woke/web3-nact');

// Actors
const TwitterAgent = require('./actors/twitter-agent');
const Oracle = require('./actors/oracle');

const debug = Logger('sys_oracle');

const defaults = {
	name: 'sys_oralce',
	maxProviderConnectionAttempts: 'dunce',
	retryInterval: 15000 * 3,
	subscriptionWatchdogInterval: 15000 * 10,
};

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

		this.a_oracle = director[this.persist ? 'start_persistent' : 'start_actor'](
			'oracle',
			Oracle,
			{
				a_contract_TwitterOracle: this.contractSystem.TwitterOracleMock,
				a_twitterAgent: this.a_twitterAgent,
				subscriptionWatchdogInterval: this.config.subscriptionWatchdogInterval,
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
