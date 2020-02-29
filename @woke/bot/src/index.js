require('dotenv').config()
const { Logger, twitter } = require('@woke/lib');
const debug = Logger();

const { spawnStateless, dispatch, query } = require('nact');
const actors = require('./actors');

const actorSystem = require('./actor-system');
const TipSystem = require('./tip-system');
const { parse_bool } = require('./lib/utils');

const TwitterStub = require('./lib/twitter-stub');


const PERSIST = process.env.PERSIST;
const persist = parse_bool(PERSIST);

// @TODO parse polling interval
console.log('Persist? ', persist);
const bootstrap = async () => {
	await twitter.initClient();
	twitterStub = new TwitterStub(twitter);

	const tipSystem = new TipSystem(undefined, {
		twitterStub,
		persist,
		pollingInterval: 5*1000,
		notify: true,
	});
	return tipSystem.start();
}

bootstrap().catch(console.log);

