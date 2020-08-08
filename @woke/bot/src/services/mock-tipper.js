// @woke/bot
// Bot is the interface between the woke network and twitter.
// It performs the following major roles:
//	1. Twitter Tipping
//	2. Woke invites

const serviceConfig = require('../config/service-config');
const { Logger, twitter, TwitterStub, mocks } = require('@woke/lib');
const TipSystem = require('../systems/tip-system');
const debug = Logger();

const bootstrap = async () => {
	//await twitter.initClient();
	const twitterStub = new TwitterStub(mocks.twitterClient.createMockClient(3));
	const tipSystem = new TipSystem({
		twitterStub: twitterStub,
		pollingInterval: 10 * 1000,
		...serviceConfig,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
