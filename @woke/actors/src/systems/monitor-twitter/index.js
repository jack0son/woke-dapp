const { ActorSystem, PersistenceEngine, actors} = require('@woke/wact');
const { Logger, twitter, TwitterStub } = require('@woke/lib');
const Channel = require('../../actors/monitor/channel');
const Monitor = require('../../actors/monitor/monitor');
const Tweeter = require('./tweeter');

const debug = Logger('sys_monitor');

const recipientId =  '932596541822418944'; // Oracle of Woke

// System monitor using twitter DMs as output channel
async function MonitorSystem(_twitter) {
	const twitterClient = !!_twitter && _twitter || twitter;
	const director = ActorSystem.bootstrap();
	await twitterClient.initClient();
	twitterStub = new TwitterStub(twitterClient);

	// Make twitter channel
	const a_tweeter = director.start_actor('tweeter', Tweeter({ twitterStub, recipientId }));
	const a_channel = director.start_actor('channel-twitter', Channel({ actor: a_tweeter, postActionName: 'send_directMessage' }));
	const a_monitor = director.start_actor('monitor', Monitor({ a_channel }));

	debug.d('Using twitter DM system monitoring');
	return {
		a_monitor
	};
}

module.exports = MonitorSystem;

// Mock tip system
if(debug.control.enabled && require.main === module) {
	MonitorSystem().then( monitorSystem => {
		ActorSystem.dispatch(monitorSystem.a_monitor, { type: 'notify', prefixString: 'test' });
	}).catch(console.log);
}
