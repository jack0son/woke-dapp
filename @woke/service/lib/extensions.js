const { TwitterDomain } = require('@woke/lib');
const { TwitterClient } = require('@woke/lib/config/twitter-config');

// @fix ContractSystemEngine is a cyclic dependence workaround
const contractSystem = (ContractSystemEngine) => (
	contractNames,
	contractInstances,
	web3ServiceOpts = {}
) => (service, conf) => {
	service.contractSystem =
		conf.contractSystem ||
		ContractSystemEngine(service.director, contractNames, contractInstances, {
			persist: service.persist,
			networkList: conf.networkList,
			...web3ServiceOpts,
		});
};

const twitterDomain = (service, conf) => {
	service.twitterClient = conf.twitterClient || TwitterClient(conf.twitterEnv).client;
	service.twitterDomain = new TwitterDomain(service.twitterClient);
	service.initializers.push(() => service.twitterDomain.init());
};

module.exports = { contractSystem, twitterDomain };
