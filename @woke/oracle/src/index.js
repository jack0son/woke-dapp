const { persist, persistenceConfig, networkList, subscriptionWatchdogInterval } = require('./config');
const { Logger, twitter, utils } = require('@woke/lib');
const OracleSystem = require('./oracle-system');
const debug = Logger();

// @TODO parse polling interval
const bootstrap = async () => {
	await twitter.initClient();

	const oracleSystem = new OracleSystem(undefined, {
		twitterClient: twitter,
		persist,
		subscriptionWatchdogInterval,
		persistenceConfig,
		networkList,
		monitoring: true,
		//retryInterval: 5*1000,
	});
	return oracleSystem.start();
}

bootstrap().catch(console.log);
