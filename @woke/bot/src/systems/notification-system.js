const { ActorSystem } = require('@woke/wact');
const { dispatch, block } = ActorSystem;
const { Service, extensions } = require('@woke/service');
const { ContractSystem } = require('@woke/web3-nact');
const { tweeter } = require('@woke/actors');
const NotifierSupervisor = require('../actors/notifier-supervisor');

const defaults = {
	name: 'sys_notify',
	faultMonitoring: false,
	persist: false,
	contractInstances: {},
};

class NotificationSystem extends Service {
	constructor(opts) {
		super(opts, defaults, [
			extensions.contractSystem(ContractSystem)(['UserRegistry'], opts.contractInstances),
			extensions.twitterDomain,
		]);
		const director = this.director;

		// Actors
		this.a_tweeter = director.start_actor('tweeter', tweeter.Tweeter(this.twitterDomain));

		this.a_notifier = director[this.persistent ? 'start_persistent' : 'start_actor'](
			'notifier', // name
			NotifierSupervisor(this.contractSystem.UserRegistry, this.a_tweeter, {
				earliestBlockNumber: this.config.earliestBlockNumber,
			}), // actor definition
			{
				onTaskComplete: this.config.onTaskComplete,
				resubscribeInterval: this.config.resubscribeInterval,
			}
		);
	}

	setTweeter(a_tweeter) {
		return block(this.a_notifier, { type: 'setTweeter', a_tweeter });
	}

	async start() {
		const self = this;
		await self.init();

		dispatch(self.a_notifier, { type: 'subscribeToTransfers' });

		console.log(`Started transaction notification system.`);
	}
}

module.exports = NotificationSystem;
