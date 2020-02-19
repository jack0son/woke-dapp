// @woke/bot
// Bot is the interface between the woke network and twitter.
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

const { Logger } = require('@woke/lib');
const debug = Logger();

const { spawnStateless, dispatch, query } = require('nact');
const actors = require('./actors');

const actorSystem = require('./actor-system');
const TipSystem = require('./tip-system');

const TwitterStub = require('./lib/twitter-stub');
const TwitterMock = require('../test/mocks/twitter-client');
const twitter = new TwitterStub({}, TwitterMock.createMockClient(1));
const tMonDefn = actors.TwitterMonitor(twitter);

const tipSystem = new TipSystem(undefined, {
	twitterStub: twitter,
	persist: false,
	pollingInterval: 1000*1000,
});

tipSystem.start();

