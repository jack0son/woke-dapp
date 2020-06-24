const { persist, persistenceConfig, networkList, subscriptionWatchdogInterval } = require('./config');
const { Logger, twitter, utils } = require('@woke/lib');
const FunderSystem = require('./funder-system');
const debug = Logger();

// @TODO parse polling interval
const bootstrap = async () => {
	await twitter.initClient();

	const funderSystem = new FunderSystem(undefined, {
		persist,
		persistenceConfig,
		networkList,
		//retryInterval: 5*1000,
	});
	return funderSystem.start();
}

bootstrap().catch(console.log);
