require('dotenv').config()
const { Logger, twitter, utils } = require('@woke/lib');
const OracleSystem = require('./oracle-system');
const debug = Logger();

const PERSIST = utils.parse_bool(process.env.PERSIST);
const SUBSCRIPTION_WATCHDOG_INTERVAL = Number(process.env.SUBSCRIPTION_WATCHDOG_INTERVAL);
const CONTEXT = process.env.CONTEXT;

const config = {
	local: {
		USER: 'woke_oracle',
		PWD: 'woke_oracle',
		DB: 'oracle_db',
		HOST: 'localhost',
		PORT: 5434,
	}
};

// @TODO parse polling interval
const bootstrap = async () => {
	await twitter.initClient();

	const oracleSystem = new OracleSystem(undefined, {
		twitterClient: twitter,
		persist: PERSIST,
		subscriptionWatchdogInterval: SUBSCRIPTION_WATCHDOG_INTERVAL,
		persistenceConfig: config[process.env.CONTEXT],
		//retryInterval: 5*1000,
	});
	return oracleSystem.start();
}

bootstrap().catch(console.log);
