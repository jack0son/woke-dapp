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
const actors = require('./actors');

const director = require('./actor-system')();

const TwitterStub = require('./lib/twitter-stub');
const TwitterMock = require('../test/mocks/twitter-client');

const twitter = new TwitterStub({}, TwitterMock.MockClient);
const tMonDefn = actors.TwitterMonitor(twitter);

const artifacts = require('@woke/contracts');
const wokeTokenInterface = artifacts[process.env.NODE_ENV !== 'development' ? 'production' : 'development'].WokeToken; 

const a_tMon = director.start_actor('twitter_monitor', tMonDefn);
const a_polling = director.start_actor('polling_service', actors.polling);

// Initialise Web3
const MAX_ATTEMPTS = 5;
const RETRY_DELAY = 400;
const a_web3 = director.start_actor('web3', actors.Web3(undefined, MAX_ATTEMPTS, {
	retryDelay: RETRY_DELAY,
}));

// Initialise Woken Contract agent
const a_wokenContract = director.start_actor('woken_contract', actors.contract, {
	a_web3, 
	contractInterface: wokeTokenInterface,
})

const a_tipper = director.start_actor('tipper', actors.tipper, {
	a_wokenContract,
})

const { spawnStateless, dispatch, query } = require('nact');

// Forward tips to the tipper
const a_conduit = spawnStateless(
	director.system,
	(msg, ctx) => {
		switch(msg.type) {
			case 'new_tips': {
				const { tips } = msg;
				tips.forEach(tip => dispatch(a_tipper, {type: 'tip', tip}));
				break;
			}

			default: {
				console.log(`Conduit got unknown msg `, msg);
			}
		}
	}
);

dispatch(a_web3, {type: 'init'})

const TIP_POLLING_INTERVAL = 10000;
dispatch(a_polling, { type: actors.polling.iface.poll,
	target: a_tMon,
	action: tMonDefn.iface.find_tips,
	period: TIP_POLLING_INTERVAL,
}, a_conduit);

