const { Logger, twitter, TwitterStub } = require('@woke/lib');
const { ActorSystem, PersistenceEngine } = require('@woke/wact');
const { TxSystem } = require('@woke/web3-nact');
const Funder = require('./actors/funder');

const web3Utils = require('web3-utils');
//const DEFAULT_WEI = web3Utils.toWei('0.08', 'ether');
const DEFAULT_WEI = web3Utils.toWei('0.2', 'ether');

const debug = Logger('sys_funder');

function directorIsStarted(director) {
	// @TODO refer to nact source
	return !!director
}

function isEthAddress(address) {
	// @TODO refer to web3 utils
	return !!address
}

class FunderSystem {
	constructor(a_txManager, opts) {
		const defaults = {
			fundAmount: DEFAULT_WEI,
			retryInterval: 150000,
			queryTimeout: 60000,
		};

		const { persist, retryInterval, persistenceConfig, networkList, queryTimeout, fundAmount } = { ...defaults, ...opts };
		this.persist = !!persist;
		this.config = {
			queryTimeout,
			retryInterval,
			persistenceConfig,
			networkList,
		};

		this.fundAmount = fundAmount;

		// Persistence
		if(this.persist) {
			debug.d(`Using persistence...`);
			this.persistenceEngine = PersistenceEngine(this.config.persistenceConfig)
		} else {
			console.warn(`Persistence not enabled.`);
		}

		this.director = ActorSystem.bootstrap(this.persist ? this.persistenceEngine : undefined);
		const director = this.director;

		// Actors
		this.a_txManager = a_txManager || TxSystem(director, { networkList, persist })

		this.a_funder = director[this.persist ? 'start_persistent' : 'start_actor']('funder', Funder, {
			a_txManager: this.a_txManager,
			fundAmount,
		});
	}

	fundAccount(address, userId) {
		const self = this;
		if(!directorIsStarted(self.director)) throw new Error(`Funder system is not running`);
		if(!isEthAddress(address)) throw new Error(`Not an address: ${address}`);
		if(!userId) throw new Error(`No userId provided`);

		//console.log(`Dispatching funding request ${userId}:${address}...`);

		// TODO: Query timeout here trigger supervision policy for funder system
		//ActorSystem.query(self.a_funder, { type: 'fund',  address, userId } , self.config.queryTimeout)
			//.then(reply => reply)
			//.catch(console.log);
		ActorSystem.dispatch(self.a_funder, { type: 'fund',  address, userId }) 
	}

	async start() {
		const self = this;

		if(self.persist) {
			debug.d(`persistence: Connecting ...`);
			try {
				await self.persistenceEngine.db.then(db => db.connect())
				debug.d(`persistence: Connected to persistence repository.`);
			} catch(error) {
				throw error;
			}
		}

		ActorSystem.dispatch(self.a_funder, { type: 'init' });

		console.log(`Started funder system.`);
	}
}

module.exports = FunderSystem;

// Mock system
if(debug.control.enabled && require.main === module) {
	var argv = process.argv.slice(2);
	const [persist, ...args] = argv;

	(async () => {
		const funderSystem = new FunderSystem(undefined, { persist: false });
		funderSystem.start();
	})()
}
