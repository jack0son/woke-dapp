require('dotenv').config()
const { Logger, twitter, TwitterStub, utils, mocks } = require('@woke/lib');
const NotificationSystem = require('../systems/notification-system');
const debug = Logger();

const persist = utils.parse_bool(process.env.PERSIST);

const bootstrap = async () => {
	const twitterStub = new TwitterStub(mocks.twitterClient.createMockClient(5));
	const notiSystem = new NotificationSystem(undefined, {
		persist,
		twitterStub,
	});
	return notiSystem.start();
}

bootstrap().catch(console.log);
