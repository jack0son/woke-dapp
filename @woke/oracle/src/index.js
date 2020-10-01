const {
	persist,
	persistenceConfig,
	networkList,
	subscriptionWatchdogInterval,
} = require('./config');
const { Logger, utils } = require('@woke/lib');
const OracleSystem = require('./oracle-system');
const twitter = require('@woke/twitter');
const debug = Logger();

// @TODO parse polling interval
const bootstrap = async () => {
	await twitter.client.initClient();

	const oracleSystem = new OracleSystem({
		twitterClient: twitter.client,
		persist,
		subscriptionWatchdogInterval,
		persistenceConfig,
		networkList,
		monitoring: true,
		//retryInterval: 5*1000,
	});
	return oracleSystem.start();
};

bootstrap().catch(console.log);
