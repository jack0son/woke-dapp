require('dotenv').config()
const { utils } = require('@woke/lib');
const { config: { networkList } } = require('@woke/web3-nact');
const CONTEXT = process.env.CONTEXT;

const persistenceConfig = {
	local: {
		USER: 'postgres',
		PWD: 'postgres',
		DB: 'woke_dapp',
		HOST: 'localhost',
		PORT: 5432,
	},
	production: {
		USER: 'woke_oracle',
		PWD: 'woke_oracle',
		DB: 'oracle_db',
		HOST: 'localhost',
		PORT: 5432,
	}
};

module.exports = {
	networkList,
	subscriptionWatchdogInterval: Number(process.env.SUBSCRIPTION_WATCHDOG_INTERVAL),
	persist: utils.parse_bool(process.env.PERSIST),
	persistenceConfig: persistenceConfig[process.env.CONTEXT || local],
	queryTimeout: 60000*5,
};
