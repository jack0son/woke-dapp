require('dotenv').config()
const { utils } = require('@woke/lib');
const { config: { networkList } } = require('@woke/web3-nact');
const CONTEXT = process.env.CONTEXT;

const persistenceConfig = {
	local: {
		USER: 'woke_oracle',
		PWD: 'woke_oracle',
		DB: 'oracle_db',
		HOST: 'localhost',
		PORT: 5434,
	}
};

module.exports = {
	networkList,
	subscriptionWatchdogInterval: Number(process.env.SUBSCRIPTION_WATCHDOG_INTERVAL),
	persist: utils.parse_bool(process.env.PERSIST),
	persistence: persistenceConfig[process.env.CONTEXT],
};
