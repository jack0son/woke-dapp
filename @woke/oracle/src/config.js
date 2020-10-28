const PERSIST_ENV = process.env.PERSIST_ENV;

const persistenceConfig = {
	local: {
		USER: 'woke_oracle',
		PWD: 'woke_oracle',
		DB: 'oracle_db',
		HOST: 'localhost',
		PORT: 5434,
	},
};

module.exports = {
	subscriptionWatchdogInterval: Number(process.env.SUBSCRIPTION_WATCHDOG_INTERVAL),
	persistenceConfig: persistenceConfig[process.env.PERSIST_ENV],
};
