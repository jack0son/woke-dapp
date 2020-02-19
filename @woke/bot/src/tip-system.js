const { spawnStateless, dispatch, query } = require('nact');

const actorSystem = require('./actor-system');
const PersistenceEngine = require('./persistence-engine');

const debug = require('@woke/lib').Logger('sys_tip');

function TipSystem(_a_wokenContract) {
	let a_wokeContract;
	if(!_a_wokenContract) {
	}

}

function create_woken_contract_actor() {
	debug.warn(`No woken contract provided, initialising my own...`)
}

// Will be initialised by bot system and passed a common woken actor
class TipSystem {
	constructor(a_wokenContract) {
		self.a_wokeContract = a_wokeContract || create_woken_contract_actor;
		self.director = bootstrap(PersistenceEngine())
	}

	start() {
		const self = this;
		const { a_wokenContract, director } = self;
	}
}
