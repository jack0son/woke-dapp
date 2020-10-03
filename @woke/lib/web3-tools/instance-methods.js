const makeContractInstanceFromConfig = (web3Instance) => (contractConfig) =>
	makeContractInstance(web3Instance)(contractConfig.instance, contractConfig.artifact);

const makeContractInstance = (web3Instance) => (contractInstance, artifact) =>
	contractInstance
		? cloneContractInstance(web3Instance)(contractInstance)
		: makeContractInstanceFromArtifact(web3Instance)(artifact);

const makeContractInstanceFromArtifact = (web3Instance) => (artifact, options) =>
	new web3Instance.web3.eth.Contract(
		artifact.abi,
		artifact.networks[web3Instance.network.id].address,
		{ data: options && options.includeData ? artifact.deployedBytecode : undefined }
	);

const cloneContractInstance = (web3Instance) => (web3Contract, options) =>
	new web3Instance.web3.eth.Contract(
		// @TODO these props are probably hidden for a reason...
		web3Contract._jsonInterface,
		web3Contract._address, //web3Contract.options.address,
		{
			data: options && options.includeData ? web3Contract.options.data : undefined,
		}
	);

module.exports = {
	makeContractInstanceFromConfig,
	makeContractInstance,
	makeContractInstanceFromArtifact,
	cloneContractInstance,
};
