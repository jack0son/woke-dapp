const { Contract } = require('../actors');
const CoreSystem = require('./core');
const { loadContract } = require('../lib/utils');

function ContractsSystem(director, contractNames, opts) {
	const { a_web3, a_nonce } = CoreSystem(director, opts);

	// Initialise Woken Contract agent
	let a_contracts = {};
	contractNames.forEach(name => {
		a_contracts[name] = director.start_actor(`a_${name}`, Contract, {
			a_web3, 
			a_nonce,
			contractInterface: loadContract(name),
		})
	});

	return a_contracts;
}

module.exports = ContractsSystem;
