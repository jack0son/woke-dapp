const serviceConfig = require('../config/service-config');
const { Logger, twitter, TwitterStub } = require('@woke/lib');
const TipSystem = require('../systems/tip-system');
const debug = Logger();

// @TODO parse polling interval
const bootstrap = async () => {
	await twitter.initClient();
	twitterStub = new TwitterStub(twitter);

	const tipSystem = new TipSystem({
		notify: true,
		twitterStub,
		pollingInterval: 5 * 1000,
		...serviceConfig,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
