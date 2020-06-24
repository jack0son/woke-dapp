require('dotenv').config()
const { utils } = require('@woke/lib');
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

const networkList = {
	development: [],
	production: ['goerli_2', 'goerli_1', 'goerli_infura'],
	goerli: ['goerli_2', 'goerli_1', 'goerli_infura'],
};

module.exports = {
	subscriptionWatchdogInterval: Number(process.env.SUBSCRIPTION_WATCHDOG_INTERVAL),
	persist: utils.parse_bool(process.env.PERSIST),
	networkList: networkList[process.env.ETH_ENV],
	persistence: persistenceConfig[process.env.CONTEXT],
};
