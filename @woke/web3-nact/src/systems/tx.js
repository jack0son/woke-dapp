const CoreSystem = require('./core');
const TxManager = require('../actors/tx-manager');

function TxSystem(director, opts) {
	const defaults = { name: 'txManager' };
	const { name, ...rest } = { ...defaults, ...opts };
	const a_txManager = director.start_actor(
		name,
		TxManager(CoreSystem(director, rest)),
		{}
	);

	return a_txManager;
}

module.exports = TxSystem;
