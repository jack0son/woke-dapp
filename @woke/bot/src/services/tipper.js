const serviceConfig = require('../config/service-config');
const { Logger } = require('@woke/lib');
const TipSystem = require('../systems/tip-system');

// @TODO parse polling interval
const bootstrap = async () => {
	const tipSystem = new TipSystem({
		pollingInterval: 5 * 1000,
		...serviceConfig,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
