const serviceConfig = require('../config/service-config');
const TipSystem = require('../systems/tip-system');

console.log(serviceConfig);

// @TODO parse polling interval
const bootstrap = async () => {
	const tipSystem = new TipSystem({
		pollingInterval: 5 * 1000,
		...serviceConfig,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
