// @woke/bot
// Bot is the interface between the woke network and twitter.
// It performs the following major roles:
//	1. Twitter Tipping
//	2. Woke invites 
//
//	Twitter tipping
//	---------------
//	A wokelord is able to send transactions from their wallet simply by sending
//	a tweet that matches the transfer tweet pattern. e.g.
//			+1000 WOKE
//			+1000 wokens
//			+1000W
//			+1000 WOKENS
//			+<integer> [#]<[woke, wokens, WOKE, WOKENS]>
//
//	Assumptions
//		- Users user must have tokens in their tipping purse 
//		- App will allocate all wokens to tipping on joining
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

const director = require('./actor-system')();

const dummyActor = {
	'print': (msg, ctx, state) => {
		// Sent WOKENS to the top three on the leaderboard
		console.log('DUMMY: ', msg.msg);
	}
}

const poll = director.start_actor('poller', actors.polling);
const dummy = director.start_actor('dummy', {actions: dummyActor}, {});

const repeat = (msg, period) => director.dispatch(poll, {type: 'poll',
	target: dummy,
	action: 'print',
	period,
	args: {
		msg
	},
});

repeat('hahahaha lolololol', 1000);

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
sleep(5000).then(() => {
	director.dispatch(poll, {type: 'interupt'})
});


const wokenMonitor = {
	// Monitor the WokeToken contract for unclaimed transfers
	'unclaimedTx': (msg, context, state) => {
		// Subscribe to unclaimed transfers
	},

	'claimedTx': (msg, context, state) => {
	}
}

const wokenAgent = {
	// Send wokens
	'transferUnclaimed': {
	}
}
