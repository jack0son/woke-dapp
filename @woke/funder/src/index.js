const { persist, persistenceConfig, networkList } = require('./config');
const { Logger } = require('@woke/lib');
const FunderSystem = require('./funder-system');
const debug = Logger();

// @TODO parse polling interval
const bootstrap = async () => {

	const funderSystem = new FunderSystem(undefined, {
		persist,
		persistenceConfig,
		networkList,
		//retryInterval: 5*1000,
	});
	return funderSystem.start();
}

bootstrap().catch(console.log);
