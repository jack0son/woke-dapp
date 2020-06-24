const { persist, networkList } = require('../config/service-config');
const { Logger, twitter, TwitterStub } = require('@woke/lib');
const TipSystem = require('../systems/tip-system');
const debug = Logger();

// @TODO parse polling interval
const bootstrap = async () => {
	await twitter.initClient();
	twitterStub = new TwitterStub(twitter);

	const tipSystem = new TipSystem(undefined, {
		twitterStub,
		persist,
		pollingInterval: 5*1000,
		notify: true,
		networkList,
	});
	return tipSystem.start();
}

bootstrap().catch(console.log);
