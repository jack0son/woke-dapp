const { Logger, twitter } = require('@woke/lib');
const debug = Logger();
const { parse_bool } = require('./lib/utils');

const { spawnStateless, dispatch, query } = require('nact');
const actors = require('./actors');
const actorSystem = require('./actor-system');
const NotificationSystem = require('./notification-system');

const TwitterStub = require('./lib/twitter-stub');
const twitterMock = require('../test/mocks/twitter-client');

const PERSIST = process.env.PERSIST;
const persist = PERSIST ? parse_bool(PERSIST) : true;

console.log('Persist? ', persist);
const bootstrap = async () => {

	const twitterStub = new TwitterStub(twitterMock.createMockClient(5));

	const notiSystem = new NotificationSystem(undefined, {
		persist,
		twitterStub,
	});
	return notiSystem.start();
}

bootstrap().catch(console.log);

