const { ActorSystem, PersistenceEngine, actors} = require('@woke/wact');
const { Logger, twitter, TwitterStub } = require('@woke/lib');
const Channel = require('../../monitor/channel');
const Monitor = require('../../monitor/monitor');
const Tweeter = require('./tweeter');

const debug = Logger('sys_monitor');

// System monitor using twitter DMs as output channel
async function MonitorSystem(_twitter) {
	const twitterClient = !!_twitter && _twitter || twitter;
	const director = bootstrap();
	await twitterClient.initClient();
	twitterStub = new TwitterStub(twitterClient);

	// Make twitter channel
	const a_tweeter = director.start_actor('tweeter', Tweeter({ twitterStub }));
	const a_channel = director.start_actor('channel:twitter', Channel({ actor: a_tweeter, postActionName: 'send_direct_message' }));
	const a_monitor = director.start_actor('monitor', Monitor({ a_channel }));

	debug('Using twitter DM system monitoring');
	return {
		a_monitor
	};
}

module.exports = MonitorSystem;

// Mock tip system
if(debug.control.enabled && require.main === module) {
	MonitorSystem().then( monitorSystem => {
		ActorSystem.dispatch(monitorSystem.a_monitor, { type: 'notify', text: 'test' });
	}).catch(console.log);
}
