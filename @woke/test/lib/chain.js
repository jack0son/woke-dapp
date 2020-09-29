const { web3Tools } = require('@woke/lib');

const isDeployed = (contract) => !!contract.options.adress;

const deployContract = (contract, artifact, args, opts) =>
	contract
		.deploy({
			data: artifact.bytecode,
			arguments: args,
		})
		.send(opts);

class ContractConfig {
	constructor(name, truffleArtifact) {
		this.name = name;
		this.artifact = truffleArtifact;
	}

	address(networkId) {
		if (!networkId) throw new Error('Must specify ID');
	}
}

class ChainDomain {
	constructor(contractConfigList, sendOpts) {
		this.configList = contractConfigList;
		this.instance = web3Tools.init.instantiate();
		this.contracts = {};
		this.sendOpts = {
			from: this.instance.account,
			...sendOpts,
		};

		this.init();
	}

	async init() {
		const { instance, configList, contracts } = this;
		configList.forEach((c) => {
			contracts[c.name] = web3Tools.utils.initContract(instance, c.artifact);
		});
		this.accounts = await this.instance.web3.eth.getAccounts();
		this.freeAccounts = [...this.accounts];
	}

	allocateAccounts(numToAlloacte) {
		if (this.freeAccounts.length < numToAlloacte) {
			throw new Error(`Only ${this.freeAccounts.length} available`);
		}
		const accounts = this.freeAccounts.slice(0, numToAlloacte);
		this.freeAccounts = this.freeAccounts.slice(numToAlloacte);
		return accounts;
	}

	// No need to be able to redeploy for the moment
	async deploy() {}
}

const configs = [
	{
		name: 'UserRegistry',
		artifact: require('../../contracts/development/UserRegistry.json'),
	},
	{ name: 'WokeToken', artifact: require('../../contracts/development/WokeToken.json') },
	{
		name: 'Oracle',
		artifact: require('../../contracts/development/TwitterOracleMock.json'),
	},
];

module.exports = (sendOpts) => new ChainDomain(configs, sendOpts);
