const CoreSystem = require('./core');
const TxManager = require('../actors/tx-manager');

function TxSystem(director, opts) {
	const defaults = { name: 'txManager' };
	const { name, ...coreOpts } = { ...defaults, ...opts };
	const a_txManager = director.start_actor(
		name,
		TxManager(CoreSystem(director, coreOpts)),
		{}
	);

	return a_txManager;
}

module.exports = TxSystem;
