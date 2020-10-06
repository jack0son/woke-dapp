const { Logger, web3Tools, configure } = require('@woke/lib');
const { useMonitor } = require('@woke/actors');
const { ActorSystem, PersistenceEngine } = require('@woke/wact');
const { TxSystem } = require('@woke/web3-nact');
const FundingSupervisor = require('./actors/supervisor');

const web3Utils = require('web3-utils');
//const DEFAULT_WEI = web3Utils.toWei('0.08', 'ether');
const DEFAULT_WEI = web3Utils.toWei('0.2', 'ether');

const debug = Logger('sys_funder');

function directorIsStarted(director) {
	// @TODO refer to nact source
	return !!director;
}

function isEthAddress(address) {
	// @TODO refer to web3 utils
	return !!address;
}

const defaults = {
	sendFaultLogs: false,
	fundAmount: DEFAULT_WEI,
	retryInterval: 150000,
	queryTimeout: 60000,
};

class FunderSystem {
	constructor(a_txManager, opts) {
		// CLEAN THIS CONFIG MESS WTF WHY SO MUCH REPEATING???

		const conf = configure(opts, defaults);
		const {
			persist,
			retryInterval,
			persistenceConfig,
			networkList,
			queryTimeout,
			fundAmount,
			sendFaultLogs,
		} = conf;
		this.persist = !!persist;

		this.fundAmount = fundAmount;

		// Persistence
		if (this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine(conf.persistenceConfig);
		} else {
			console.warn(`Persistence not enabled.`);
		}

		this.director = ActorSystem.bootstrap(
			this.persist ? this.persistenceEngine : undefined
		);
		const director = this.director;

		if (!!conf.sendFaultLogs) {
			// Initialise monitor using own actor system and twitter client
			this.monitor = useMonitor({ director });
		}

		// Actors
		this.a_txManager = a_txManager || TxSystem(director, { networkList, persist });

		this.a_funder = director[this.persist ? 'start_persistent' : 'start_actor'](
			'supervisor',
			FundingSupervisor(this.a_txManager, '0x0', { fundAmount }),
			{}
		);
	}

	fundAccount(address, userId) {
		const self = this;
		if (!directorIsStarted(self.director))
			throw new Error(`Funder system is not running`);
		if (!isEthAddress(address)) throw new Error(`Not an address: ${address}`);
		if (!userId) throw new Error(`No userId provided`);

		//console.log(`Dispatching funding request ${userId}:${address}...`);

		// TODO: Query timeout here trigger supervision policy for funder system
		//ActorSystem.query(self.a_funder, { type: 'fund',  address, userId } , self.config.queryTimeout)
		//.then(reply => reply)
		//.catch(console.log);
		ActorSystem.dispatch(self.a_funder, { type: 'fund', address, userId });
	}

	async start() {
		const self = this;

		if (self.persist) {
			debug.d(`persistence: Connecting ...`);
			try {
				await self.persistenceEngine.db.then((db) => db.connect());
				debug.d(`persistence: Connected to persistence repository.`);
			} catch (error) {
				throw error;
			}
		}

		ActorSystem.dispatch(self.a_funder, { type: 'init' });

		console.log(`Started funder system.`);
		console.log(
			`Fund each user with ${web3Tools.utils.valueString(web3Utils)(self.fundAmount)}`
		);
	}
}

module.exports = FunderSystem;
