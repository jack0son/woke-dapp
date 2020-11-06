const j0 = require('@woke/jack0son');
const { web3Tools, Logger } = require('@woke/lib');
const debug = Logger('test:contract');

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

function updateArtifact(path, networks) {
	const artifact = JSON.parse(path);
	const update = (network) => {
		const { networkId, instance, address } = n;
		if (!n.networkId) throw new Error('Must provide network ID');
		if (instance) {
			// Store instance
		} else {
			// Store options granularly
			if (address) {
				artifact.networks[networkId].address = address;
			}
		}

		fs.writeFileSync(path, JSON.stringify(artifact));
	};

	if (!Array.isArray(networks)) {
		update(networks);
	} else {
		networks.forEach(update);
	}
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
	constructor(contractConfigList, opts = {}) {
		const { sendOpts, network } = opts;
		this.configList = contractConfigList;
		if (process.env.ETH_ENV !== 'development')
			console.warn(
				`WARNING: ETH_ENV should be development. ETH_ENV == ${process.env.ETH_ENV}`
			);

		const _network = j0.exists(network)
			? (network == 'none' && undefined) || network // if none specified allow env to determine
			: 'development'; // by default use development
		this.instance = web3Tools.init.instantiate(_network);
		this.contracts = {};
		this.configs = {};

		const { gasLimit, gasPrice } = this.instance.network;
		this.sendOpts = {
			from: this.instance.account,
			gas: gasLimit,
			gasPrice,
			...sendOpts,
		};
	}

	logAddresses() {
		Object.entries(this.contracts).forEach(([name, contract]) => {
			console.log(name.padEnd(16) + ' ', contract.options.address);
		});
	}

	async init() {
		const { instance, configList, contracts } = this;
		configList.forEach((c) => {
			debug.name(c.name, 'Loading truffle artifact...');
			contracts[c.name] = web3Tools.methods.makeContractInstanceFromArtifact(instance)(
				c.artifact,
				{
					includeData: true,
				}
			);
			this.configs[c.name] = c;
		});
		this.accounts = await this.instance.web3.eth.getAccounts();
		this.freeAccounts = [...this.accounts];

		this.allocateAdminAccounts();
		return this;
	}

	allocateAdminAccounts() {
		if (!this.adminAccounts) {
			// Take the frist 4 accounts (default accounts used to migrate contracts)
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

	async redeploy(contractNames = ['UserRegistry', 'Oracle'], opts = {}) {
		const { updateArtifacts } = opts;

		// woke token
		const { configs, sendOpts, adminAccounts, instance } = this;
		contractNames.forEach((name) => {
			if (!this.contracts[name]) throw new Error(`Contract '${name}' in not initialised`);
		});

		// Must redeploy in this order
		if (contractNames.includes('Oracle')) {
			//console.log('Current Oracle address:', this.contracts.Oracle.options.address);
			debug.d(`Deploying Oracle...`);
			let tx;
			try {
				tx = this.contracts.Oracle.deploy({
					// this.contracts.Oracle = await this.contracts.Oracle.deploy({
					data: configs.Oracle.artifact.bytecode,
					// data: this.contracts.Oracle.options.data,
					arguments: [this.adminAccounts.oraclize_cb],
				});
				// }).send({

				// @TODO Send opts defaults should be set on contract initialisation
				const { data, to, ..._sendOpts } = sendOpts;
				this.contracts.Oracle = await tx.send({
					// this.contracts.Oracle = await tx.send({
					value: 5000000000000000,
					..._sendOpts,
				});
			} catch (error) {
				// console.log({ tx });
				throw error;
			}

			updateArtifacts &&
				updateArtifact(configs.Oracle.path, {
					networkId: this.instance.network.id,
					adddress: this.contracts.Oracle.options.address,
				});
		}

		const userRegistryContructorArguments = ({
			wokeTokenAddress,
			lnpdfAddress,
			oracleAddress,
			ownerAccount,
			maxTributors,
		}) => [wokeTokenAddress, lnpdfAddress, oracleAddress, ownerAccount, maxTributors];

		if (contractNames.includes('UserRegistry')) {
			const originalAddress = this.contracts.UserRegistry.options.address.slice(0);

			// console.log(
			// 	'Current UserRegistry address:',
			// 	this.contracts.UserRegistry.options.address
			// );
			debug.d(`Deploying UserRegistry...`);
			const args = userRegistryContructorArguments({
				wokeTokenAddress: this.contracts.WokeToken.options.address,
				lnpdfAddress: this.contracts.LNPDF.options.address,
				oracleAddress: this.contracts.Oracle.options.address,
				ownerAccount: adminAccounts.owner,
				maxTributors: 256,
			});

			let tx = this.contracts.UserRegistry.deploy({
				// this.contracts.UserRegistry = await this.contracts.UserRegistry.deploy({
				data: web3Tools.linkBytecode(configs.UserRegistry.artifact, instance.network.id),
				arguments: args,
			});
			// console.log({ tx });

			debug.d(`Deploying UserRegistry...`);
			// @TODO Send opts defaults should be set on contract initialisation
			const { data, to, ..._sendOpts } = sendOpts;
			this.contracts.UserRegistry = await tx.send(_sendOpts);

			// Update the user registry address in the token contract
			debug.d(`Set WokeToken UserRegistry...`);
			await this.contracts.WokeToken.methods
				.setUserRegistry(this.contracts.UserRegistry.options.address)
				.send(_sendOpts);
			// console.log('New UserRegistry address:', this.contracts.UserRegistry.options.address);
			updateArtifacts &&
				updateArtifact(this.configs.UserRegistry.path, {
					networkId: this.instance.network.id,
					adddress: this.contracts.UserRegistry.options.address,
				});
		}
	}

	// No need to be able to redeploy for the moment
	async deploy() {}
}

const configs = [
	{
		name: 'UserRegistry',
		artifact: require('../../../contracts-src/build/contracts/artifacts/UserRegistry.json'),
		path: '../../../contracts-src/build/contracts/artifacts/UserRegistry.json',
	},
	{
		name: 'WokeToken',
		artifact: require('../../../contracts-src/build/contracts/artifacts/WokeToken.json'),
		path: '../../../contracts-src/build/contracts/artifacts/WokeToken.json',
	},
	{
		name: 'Oracle',
		artifact: require('../../../contracts-src/build/contracts/artifacts/TwitterOracleMock.json'),
		path: '../../../contracts-src/build/contracts/artifacts/TwitterOracleMock.json',
	},
	{
		name: 'LNPDF',
		artifact: require('../../../contracts-src/build/contracts/artifacts/LogNormalPDF.json'),
		path: '../../../contracts-src/build/contracts/artifacts/LogNormalPDF.json',
	},
];

module.exports = (sendOpts) => new ContractDomain(configs, sendOpts);
