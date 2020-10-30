const { ActorSystem, PersistenceEngine, actors } = require('@woke/wact');
const { Logger, TwitterDomain } = require('@woke/lib');
const twitter = require('@woke/twitter');
const Channel = require('../../actors/monitor/channel');
const Monitor = require('../../actors/monitor/monitor');
const Tweeter = require('./tweeter');

const debug = Logger('sys_monitor');

const recipientId = '932596541822418944'; // Oracle of Woke

// System monitor using twitter DMs as output channel
function MonitorSystem({ director, twitterClient }) {
	let _twitterClient = twitter.client;
	if (!!twitterClient) {
		console.log({ twitterClient });
		_twitterClient = twitterClient;
	} else {
		_twitterClient
			.initClient()
			.then(() => console.log(`Crash monitor initialised twitter client`))
			.catch(console.log);
	}

	const _director = director || ActorSystem.bootstrap();
	twitterDomain = new TwitterDomain(_twitterClient);
	debug.d('Twitter domain ready?', twitterDomain.ready());

	// Make twitter channel
	const a_tweeter = _director.start_actor(
		'monitor-tweeter',
		Tweeter({ twitterDomain, recipientId })
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
