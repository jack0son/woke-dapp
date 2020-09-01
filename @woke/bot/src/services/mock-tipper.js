const serviceConfig = require('../config/service-config');
const { Logger, twitter, TwitterStub, mocks } = require('@woke/lib');
const TipSystem = require('../systems/tip-system');
const debug = Logger();

const bootstrap = async () => {
	//await twitter.initClient();
	const twitterStub = new TwitterStub(mocks.twitterClient.createMockClient(3));
	const tipSystem = new TipSystem({
		...serviceConfig,
		twitterStub: twitterStub,
		pollingInterval: 10 * 1000,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
