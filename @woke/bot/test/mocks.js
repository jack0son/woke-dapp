const { Deferral, Logger } = require('@woke/lib');
const logger = Logger('mock').d;

// Catch job statuses from the tip supervisor instead of posting tweets
const MockTweeter = (director) => (callbacks) =>
	director.start_actor(
		'mock-tweeter',
		{
			actions: {
				tweet: (state, msg, ctx) => {
					//const msgExample = { type: 'tweet', tweetType: 'tip-seen', tip: {} };
					const { tweetType, tip } = msg;
					if (!tip) throw new Error('No tip provided by tip supervisor');
					if (!tweetType) throw new Error('No tweetType provided by tip supervisor');
					callbacks[tweetType] && callbacks[tweetType](tip);
					const tweet = { full_text: 'dummy tweet' };
					director.dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
				},
			},
			properties: {},
		},
		{}
	);

const callbacks = {
	'tip-seen': () => {},
	'tip-confirmed': () => {},
	'tip-invalid': () => {},
	'tip-failed': () => {},
};

// Twitter mock callbacks
const CallbackMock = (deferredCallback, msg) => {
	const deferred = new Deferral();
	return {
		callback: deferredCallback(deferred, msg),
		deferred,
	};
};

// @param expectedTip: passed by mockTweeter target function
const wasDispatched = (deferred, msg) => (expectedTip) => {
	logger(msg);
	//expect(tip).to.deep.equal(expectedTip);
	logger(expectedTip);
	deferred.resolve();
};

const wasNotDispatched = (deferred) => (expectedTip) => {
	deferred.reject();
};

module.exports = { MockTweeter, CallbackMock, wasDispatched, wasNotDispatched };
