require('dotenv').config()
const { Logger, twitter, TwitterStub, utils } = require('@woke/lib');
const TipSystem = require('../systems/tip-system');
const debug = Logger();

const PERSIST = utils.parse_bool(process.env.PERSIST);

// @TODO parse polling interval
const bootstrap = async () => {
	await twitter.initClient();
	twitterStub = new TwitterStub(twitter);

	const tipSystem = new TipSystem(undefined, {
		twitterStub,
		persist: PERSIST,
		pollingInterval: 5*1000,
		notify: true,
	});
	return tipSystem.start();
}

bootstrap().catch(console.log);
