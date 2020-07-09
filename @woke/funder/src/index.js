const { persist, persistenceConfig, networkList, queryTimeout, retryInterval } = require('./config');
const { Logger } = require('@woke/lib');
const FunderSystem = require('./funder-system');
const debug = Logger();

// @TODO parse polling interval
module.exports =  () => new FunderSystem(undefined, {
		persist,
		persistenceConfig,
		networkList,
		queryTimeout, 
		retryInterval,
		//retryInterval: 5*1000,
});
