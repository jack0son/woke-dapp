const AppApi = require('../api');
const contractApi = require('@woke/api');
const ContractDomain = require('./contract');

// High level application domain
class WokeDomain {
	constructor(contractDomain) {
		this.contractDomain = contractDomain;
		this.contractApi = Object.create(null);
	}

	async init() {
		this.contractApi.Oracle = contractApi.TwitterOracle(
			this.contractDomain.contracts.Oracle
		);
		this.contractApi.UserRegistry = contractApi.UserRegistry(
			this.contractDomain.contracts.UserRegistry
		);
		this.contractApi.WokeToken = contractApi.WokeToken(
			this.contractDomain.contracts.WokeToken
		);

		this.api = AppApi(
			this.contractDomain.adminAccounts,
			this.contractDomain.instance,
			() => this.contractDomain.contracts,
			this.contractApi,
			this.contractDomain.sendOpts
		);
	}

	api() {
		if (!this.api) throw new Error('API not initialised');
		return;
	}
}

module.exports = async (contractDomain) => {
	const wd = new WokeDomain(contractDomain);
	await wd.init();
	return wd;
};
