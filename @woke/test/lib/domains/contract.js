const { web3Tools } = require('@woke/lib');
const linkBytecode = require('../linkBytecode');

const isDeployed = (contract) => !!contract.options.adress;

const deployContract = (contract, artifact, args, opts) =>
	contract
		.deploy({
			data: contract.options.data || artifact.bytecode,
			arguments: args,
		})
		.send(opts);

function deployUserRegistry(contractInstance, oracleAddress, maxSupply, sendOpts) {
	console.log(`Deploying UserRegistry...`);
	return deployContract(contractInstance, [oracleAddress, maxSupply], sendOpts);
}

class ContractConfig {
	constructor(name, truffleArtifact) {
		this.name = name;
		this.artifact = truffleArtifact;
	}

	address(networkId) {
		if (!networkId) throw new Error('Must specify ID');
	}
}

class ContractDomain {
	constructor(contractConfigList, sendOpts) {
		this.configList = contractConfigList;
		this.instance = web3Tools.init.instantiate();
		this.contracts = {};
		this.configs = {};

		const { gasLimit, gasPrice } = this.instance.network;
		this.sendOpts = {
			from: this.instance.account,
			gas: gasLimit,
			gasPrice,
			...sendOpts,
		};

		this.init();
	}

	logAddresses() {
		Object.entries(this.contracts).forEach(([name, contract]) => {
			console.log(name.padEnd(16) + ' ', contract.options.address);
		});
	}

	async init() {
		const { instance, configList, contracts } = this;
		configList.forEach((c) => {
			contracts[c.name] = web3Tools.utils.initContract(instance, c.artifact, {
				includeData: true,
			});
			this.configs[c.name] = c;
		});
		this.accounts = await this.instance.web3.eth.getAccounts();
		this.freeAccounts = [...this.accounts];
		this.allocateAdminAccounts();
		return this;
	}

	allocateAdminAccounts() {
		if (!this.adminAccounts) {
			const [defaultAccount, owner, oraclize_cb, tipAgent] = this.allocateAccounts(4);
			this.adminAccounts = {
				defaultAccount,
				owner,
				oraclize_cb,
				tipAgent,
			};
			this.sendOpts.from = defaultAccount;
		}
	}

	allocateAccounts(numToAlloacte) {
		if (this.freeAccounts.length < numToAlloacte) {
			throw new Error(`Only ${this.freeAccounts.length} available`);
		}
		const accounts = this.freeAccounts.slice(0, numToAlloacte);
		this.freeAccounts = this.freeAccounts.slice(numToAlloacte);
		return accounts;
	}

	async redeploy(contractNames = ['UserRegistry', 'Oracle']) {
		// woke token
		const { contracts, configs, sendOpts, adminAccounts, instance } = this;
		contractNames.forEach((name) => {
			if (!contracts[name]) throw new Error(`Contract '${name}' in not initialised`);
		});

		// Must redeploy in this order
		if (contractNames.includes('Oracle')) {
			console.log('Current Oracle address:', contracts.Oracle.options.address);
			console.log(`Deploying Oracle...`);
			const bytecode = configs.Oracle.artifact.bytecode;
			contracts.Oracle = await contracts.Oracle.deploy({
				data: bytecode,
				arguments: [this.adminAccounts.oraclize_cb],
			}).send({
				value: 5000000000000000,
				...sendOpts,
			});
			console.log('New Oracle address:', contracts.Oracle.options.address);
		}

		const userRegistryContructorArguments = ({
			wokeTokenAddress,
			lnpdfAddress,
			oracleAddress,
			ownerAccount,
			maxTributors,
		}) => [wokeTokenAddress, lnpdfAddress, oracleAddress, ownerAccount, maxTributors];

		if (contractNames.includes('UserRegistry')) {
			const originalAddress = contracts.UserRegistry.options.address.slice(0);

			console.log(
				'Current UserRegistry address:',
				contracts.UserRegistry.options.address
			);
			console.log(`Deploying UserRegistry...`);
			console.log('using oracle address', contracts.Oracle.options.address);
			const args = userRegistryContructorArguments({
				wokeTokenAddress: contracts.WokeToken.options.address,
				lnpdfAddress: contracts.LNPDF.options.address,
				oracleAddress: contracts.Oracle.options.address,
				ownerAccount: adminAccounts.owner,
				maxTributors: 256,
			});

			contracts.UserRegistry = await contracts.UserRegistry.deploy({
				data: linkBytecode(configs.UserRegistry.artifact, instance.network.id),
				arguments: args,
			}).send(sendOpts);

			// Update the user registry address in the token contract
			await contracts.WokeToken.methods
				.setUserRegistry(contracts.UserRegistry.options.address)
				.send(sendOpts);
			console.log('New UserRegistry address:', contracts.UserRegistry.options.address);
		}
	}

	// No need to be able to redeploy for the moment
	async deploy() {}
}

const configs = [
	{
		name: 'UserRegistry',
		artifact: require('../../../contracts-src/build/contracts/artifacts/UserRegistry.json'),
	},
	{
		name: 'WokeToken',
		artifact: require('../../../contracts-src/build/contracts/artifacts/WokeToken.json'),
	},
	{
		name: 'Oracle',
		artifact: require('../../../contracts-src/build/contracts/artifacts/TwitterOracleMock.json'),
	},
	{
		name: 'LNPDF',
		artifact: require('../../../contracts-src/build/contracts/artifacts/LogNormalPDF.json'),
	},
];

module.exports = (sendOpts) => new ContractDomain(configs, sendOpts);
