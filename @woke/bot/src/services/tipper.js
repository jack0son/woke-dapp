const serviceConfig = require('../config/service-config');
const web3Config = require('@woke/web3-nact').config;
const TipSystem = require('../systems/tip-system');

serviceConfig.networkList = web3Config.networkList;
console.log('config', serviceConfig);

// @TODO parse polling interval
const bootstrap = async () => {
	const tipSystem = new TipSystem({
		pollingInterval: 5 * 1000,
		...serviceConfig,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
