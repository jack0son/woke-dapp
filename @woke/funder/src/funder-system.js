const { Logger, web3Tools, configure } = require('@woke/lib');
const { ActorSystem } = require('@woke/wact');
const { Service } = require('@woke/service');
const { TxSystem } = require('@woke/web3-nact');
const web3Utils = require('web3-utils');
const FundingSupervisor = require('./actors/supervisor');

const DEFAULT_WEI = web3Utils.toWei('0.2', 'ether');

function directorIsStarted(director) {
	// @TODO refer to nact source
	return !!director;
}

function isEthAddress(address) {
	// @TODO refer to web3 utils
	return !!address;
}

const defaults = {
	name: 'sys_funder',
	sendFaultLogs: false,
	fundAmount: DEFAULT_WEI,
	retryInterval: 150000,
	queryTimeout: 60000,
};

class FunderSystem extends Service {
	constructor(opts) {
		super(opts, defaults, []);
		const director = this.director;

		// Actors
		const { persist, networkList, fundAmount, onFundingComplete } = this.config;
		this.fundAmount = fundAmount;
		this.a_txManager =
			this.config.a_txManager || TxSystem(director, { networkList, persist });
		this.a_funder = director[this.persistent ? 'start_persistent' : 'start_actor'](
			'supervisor',
			FundingSupervisor(this.a_txManager, '0x0', { fundAmount, onFundingComplete }),
			{}
		);
	}

	fundAccount(address, userId) {
		const self = this;
		if (!directorIsStarted(self.director))
			throw new Error(`Funder system is not running`);

		// @TODO these errors should throw inside the actor system
		// if (!isEthAddress(address)) throw new Error(`Not an address: ${address}`);
		// if (!userId) throw new Error(`No userId provided`);

		//console.log(`Dispatching funding request ${userId}:${address}...`);

		// @TODO Query timeout here trigger supervision policy for funder system
		//ActorSystem.query(self.a_funder, { type: 'fund',  address, userId } , self.config.queryTimeout)
		//.then(reply => reply)
		//.catch(console.log);
		ActorSystem.dispatch(self.a_funder, {
			type: 'submit',
			task: { address, userId, fundAmount: self.fundAmount },
		});
	}

	restartTasks() {
		const self = this;
		ActorSystem.dispatch(self.a_funder, { type: 'restart' });
	}

	async start() {
		const self = this;

		self.restartTasks();

		console.log(`Started funder system.`);
		console.log(
			`Funding each user with ${web3Tools.utils.valueString(web3Utils)(self.fundAmount)}`
		);
	}
}

module.exports = FunderSystem;
