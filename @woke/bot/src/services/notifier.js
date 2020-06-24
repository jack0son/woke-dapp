const { persist, networkList } = require('../config/service-config');
const { Logger, twitter, TwitterStub } = require('@woke/lib');
const NotificationSystem = require('../systems/notification-system');
const debug = Logger();

const bootstrap = async () => {
	await twitter.initClient();
	const twitterStub = new TwitterStub(twitter);
	const notiSystem = new NotificationSystem(undefined, {
		persist,
		twitterStub,
		networkList,
	});
	return notiSystem.start();
}

bootstrap().catch(console.log);
