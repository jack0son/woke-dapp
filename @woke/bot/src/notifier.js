const { Logger, twitter } = require('@woke/lib');
const debug = Logger();
const { parse_bool } = require('./lib/utils');
const TwitterStub = require('./lib/twitter-stub');

const { spawnStateless, dispatch, query } = require('nact');
const actors = require('./actors');
const actorSystem = require('./actor-system');
const NotificationSystem = require('./notification-system');

const PERSIST = process.env.PERSIST;
const persist = parse_bool(PERSIST);

console.log('Persist? ', persist);
const bootstrap = async () => {

	await twitter.initClient();
	const twitterStub = new TwitterStub(twitter);

	const notiSystem = new NotificationSystem(undefined, {
		persist,
		twitterStub,
	});
	return notiSystem.start();
}

bootstrap().catch(console.log);

