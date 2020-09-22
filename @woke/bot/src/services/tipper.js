const serviceConfig = require('../config/service-config');
const { Logger, twitter } = require('@woke/lib');
const TipSystem = require('../systems/tip-system');
const debug = Logger();

// @TODO parse polling interval
const bootstrap = async () => {
	await twitter.initClient();

	const tipSystem = new TipSystem({
		notify: true,
		twitterClient: twitter,
		pollingInterval: 5 * 1000,
		...serviceConfig,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
