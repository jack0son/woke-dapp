// @woke/bot
// Bot is the interface between the woke network and twitter.
// It performs the following major roles:
//	1. Twitter Tipping
//	2. Woke invites 
//
//	Woke Invites
//	------------
//	When an NPC (unclaimed twitter user) receives wokens, the bot will tweet an
//	invitation @'ing the sender and a balance update. 
//		1. DM the user that TX has been started.
//		2. ?????????
//	Other features:
//		- Tweeting bonus notifications
//		- When an unclaimed user joins posting @jack joined creating 33243232
//		WOKENs
//
//	Twitter WokeDrop
//	Every 12h the bot will find a user who has mentioned woke (or phrases from
//	some wokeness dictionary) with the highest number of followers and send
//	them some WOKE.

const { persist, networkList } = require('../config/service-config');
const { Logger, twitter, TwitterStub, mocks } = require('@woke/lib');
const TipSystem = require('../systems/tip-system');
const debug = Logger();

const bootstrap = async () => {
	//await twitter.initClient();
	const twitterStub = new TwitterStub(mocks.twitterClient.createMockClient(3));
	const tipSystem = new TipSystem(undefined, {
		twitterStub: twitterStub,
		persist,
		networkList,
		pollingInterval: 10*1000,
		notify: true,
	});
	return tipSystem.start();
}

bootstrap().catch(console.log);
