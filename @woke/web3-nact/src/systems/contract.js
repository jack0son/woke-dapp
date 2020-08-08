const { Contract } = require('../actors');
const CoreSystem = require('./core');
const { loadContract } = require('../lib/utils');

function ContractsSystem(director, contractNames, opts) {
	const { a_web3, a_nonce } = CoreSystem(director, opts);

	// Initialise Woken Contract agent
	return contractNames.reduce(
		(a_contracts, name) => ({
			...a_contracts,
			[name]: director.start_actor(`a_${name}`, Contract, {
				a_web3,
				a_nonce,
				contractInterface: loadContract(name),
			}),
		}),
		{}
	);
}

module.exports = ContractsSystem;
