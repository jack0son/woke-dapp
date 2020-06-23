require('dotenv').config()
const { Logger, twitter, TwitterStub, utils } = require('@woke/lib');
const NotificationSystem = require('../systems/notification-system');
const debug = Logger();

const PERSIST = utils.parse_bool(process.env.PERSIST);

const bootstrap = async () => {
	await twitter.initClient();
	const twitterStub = new TwitterStub(twitter);
	const notiSystem = new NotificationSystem(undefined, {
		persist: PERSIST,
		twitterStub,
	});
	return notiSystem.start();
}

bootstrap().catch(console.log);
