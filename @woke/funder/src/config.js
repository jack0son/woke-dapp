require('dotenv').config();
const { utils } = require('@woke/lib');
const {
	config: { networkList },
} = require('@woke/web3-nact');
const PERSIST_ENV = process.env.PERSIST_ENV;

const persistenceConfig = {
	local: {
		USER: 'postgres',
		PWD: 'postgres',
		DB: 'woke_dapp',
		HOST: 'localhost',
		PORT: 5432,
	},
	staging: {
		USER: 'postgres',
		PWD: 'postgres',
		DB: 'woke_dapp',
		HOST: 'db',
		PORT: 5432,
	},
	production: {
		USER: 'postgres',
		PWD: 'postgres',
		DB: 'woke_dapp',
		HOST: 'db',
		PORT: 5432,
	},
};

const retryInterval = process.env.NODE_ENV == 'development' ? 5000 : 150000;

module.exports = {
	subscriptionWatchdogInterval: Number(process.env.SUBSCRIPTION_WATCHDOG_INTERVAL),
	persistenceConfig: persistenceConfig[process.env.PERSIST_ENV || 'local'],
	queryTimeout: 60000 * 5,
	retryInterval,
};
