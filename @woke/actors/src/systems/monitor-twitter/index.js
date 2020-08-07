const { ActorSystem, PersistenceEngine, actors } = require('@woke/wact');
const { Logger, twitter, TwitterStub } = require('@woke/lib');
const Channel = require('../../actors/monitor/channel');
const Monitor = require('../../actors/monitor/monitor');
const Tweeter = require('./tweeter');

const debug = Logger('sys_monitor');

const recipientId = '932596541822418944'; // Oracle of Woke

// System monitor using twitter DMs as output channel
function MonitorSystem({ director, twitterClient }) {
	let _twitterClient = twitter;
	if (!!twitterClient) {
		_twitterClient = twitterClient;
	} else {
		_twitterClient
			.initClient()
			.then(() => debug.d(`Monitor initialised twitter client`))
			.catch(console.log);
	}

	const _director = director || ActorSystem.bootstrap();
	twitterStub = new TwitterStub(_twitterClient);

	// Make twitter channel
	const a_tweeter = _director.start_actor(
		'monitor-tweeter',
		Tweeter({ twitterStub, recipientId })
	);
	const a_channel = _director.start_actor(
		'channel-twitter',
		Channel({ actor: a_tweeter, postActionName: 'send_directMessage' })
	);
	const a_monitor = _director.start_actor('monitor', Monitor({ a_channel }));

	debug.d('Using twitter DM system monitoring');
	return {
		a_monitor,
		director: _director,
	};
}

module.exports = MonitorSystem;

// Mock tip system
if (debug.control.enabled && require.main === module) {
	MonitorSystem({})
		.then((monitorSystem) => {
			ActorSystem.dispatch(monitorSystem.a_monitor, {
				type: 'notify',
				prefixString: 'monitorPrefix',
			});
		})
		.catch(console.log);
}
