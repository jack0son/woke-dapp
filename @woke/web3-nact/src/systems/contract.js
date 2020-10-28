const { Contract } = require('../actors');
const CoreSystem = require('./core');
const { loadArtifactByName } = require('../lib/contract');

const defaultContractOpts = { contractNames: [], contractConfigs: [] };
const contractConfig = { name: 'example', instance: 'web3 contract instance' };

function ContractsSystem(director, contractNames, contractInstances = {}, coreOpts) {
	const coreActors = CoreSystem(director, coreOpts);

	return contractNames.reduce((contractActors, name) => {
		const initialState = { ...coreActors, name };
		const instance = contractInstances[name];
		initialState.contractConfig = instance
			? { instance }
			: { artifact: loadArtifactByName(name) };

		contractActors[name] = director.start_actor(`a_${name}`, Contract, initialState);
		return contractActors;
	}, {});
}

module.exports = ContractsSystem;
