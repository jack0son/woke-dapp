const AppApi = require('./api');
const contractApi = require('@woke/api');
const ChainDomain = require('./chain');

// High level application domain
class WokeDomain {
	constructor(chainDomain) {
		this.chainDomain = chainDomain;
		this.contractApi = Object.create(null);
	}

	async init() {
		// Take the frist 4 accounts (default accounts used to migrate contracts)
		const accounts = await this.chainDomain.allocateAccounts(4);
		this.contractApi.Oracle = contractApi.TwitterOracle(
			this.chainDomain.contracts.Oracle
		);
		this.contractApi.UserRegistry = contractApi.UserRegistry(
			this.chainDomain.contracts.UserRegistry
		);
		this.contractApi.WokeToken = contractApi.WokeToken(
			this.chainDomain.contracts.WokeToken
		);

		this.api = AppApi(
			accounts,
			this.chainDomain.instance,
			this.chainDomain.contracts,
			this.contractApi
		);
	}

	api() {
		if (!this.api) throw new Error('API not initialised');
		return;
	}
}

module.exports = async (chainDomain) => {
	const wd = new WokeDomain(chainDomain);
	await wd.init();
	return wd;
};
