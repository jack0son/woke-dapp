// @woke/bot // Bot is the interface between the woke network and twitter.
// It performs the following major roles:
//	1. Twitter Tipping
//	2. Woke invites 
//
//
//
//	Woke Invites
//	------------
//	When an NPC (unclaimed twitter user) receives wokens, the bot will tweet an
//	invitation @'ing the sender and a balance update. 
//		1. DM the user that TX has been started.
//		2. kkkk
//	Other featuers:
//		- Tweeting bonus notifications
//		- When an unclaimed user joins posting @jack joined creating 33243232
//		WOKENs
//
//	Twitter WokeDrop
//	Every 12h the bot will find a user who has mentioned woke (or phrases from
//	some wokeness dictionary) with the highest number of followers and send
//	them some WOKE.
//
// //	Actors
//		- WokeToken monitor
//		- Twitter monitor
//		- Tweeter
//
//
// Message rules
//	Responses:
//		-- msg = { type: ACTOR_DEFN_NAME }

const { Logger, twitter } = require('@woke/lib');
const debug = Logger();

const { spawnStateless, dispatch, query } = require('nact');
const actors = require('./actors');

const actorSystem = require('./actor-system');
const TipSystem = require('./tip-system');
const { parse_bool } = require('./lib/utils');

const TwitterStub = require('./lib/twitter-stub');


const PERSIST_TIPS = process.env.PERSIST_TIPS;
const persist = parse_bool(PERSIST_TIPS);

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

