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

const { Logger } = require('@woke/lib');
const debug = Logger();
const actors = require('./actors');

const director = require('./actor-system')();

const TwitterStub = require('./lib/twitter-stub');
const TwitterMock = require('../test/mocks/twitter-client');

const twitter = new TwitterStub({}, TwitterMock.MockClient);
const tMonDefn = actors.TwitterMonitor(twitter);

const a_tMon = director.start_actor('twitter_monitor', tMonDefn);
const a_polling = director.start_actor('polling_service', actors.polling);

const { spawnStateless, dispatch, query } = require('nact');
const a_conduit = {
	actions: {
	}
}

const a_conduit = spawnStateless(
	director.system,
	(msg, ctx) => {
		switch(msg.type) {
			case 'new_tips': {
				const { tips } = msg;
				tips.forEach(tip => dispatch(a_woken, {type: 'tip', tip: tip}));
			}

			default: {
				console.log(`Conduit got unknown msg ${msg}`);
			}
		}
	}
);

dispatch(a_polling, { type: polling.iface.poll,
	target: a_tMon,
	action: tMonDefn.iface.find_tips,
	period: 500,
}, a_woken);

const wokenMonitor = {
	'establishWsConnection': () => {
	}
	// Monitor the WokeToken contract for unclaimed transfers
	'unclaimedTx': (msg, context, state) => {
		// Subscribe to unclaimed transfers
	},

	'claimedTx': (msg, context, state) => {
	}
}

const tipAgent = {
	'new_tip': () => {
	}

	'handle_tips': () => {
		for each tip {
		 dispatch(new tip)
		}
	}
}

const wokenAgent = {
	// Send wokens
	'transferUnclaimed': {
	},

	'transferClaimed': {
	},
}
