const { ActorSystem, supervision: { exponentialRetry } } = require('@woke/wact');
const { start_actor, dispatch, query } = ActorSystem;
const messageTemplates = require('../lib/message-templates');

//const { Logger } = require('@woke/lib');
//const debug = (msg, args) => Logger().name(`TWEET`, `${msg.type}>> ` + args);

// @TODO add to error directory on notion
// Twitter error response:
// { errors: [ { code: 187, message: 'Status is a duplicate.' } ] }

// @brokenwindow this should be initialised at actor spawning
const retry = exponentialRetry(100);
const retryDaily = exponentialRetry(1000);

// Drives posting to twitter
const TweeterActor = (twitterStub) => ({
	properties: {
		initialState: {
			twitter: twitterStub,
		},

		onCrash: (msg, error, ctx) => {
			const twitterError = error[0];

			if(!(twitterError && twitterError.code)) {
				console.log('Invalid twitter error: ', error);
				return ctx.resume;
			}

			switch(twitterError.code) {
				case 326:
					console.log('--------- Twitter Account locked ---------')
					console.log(msg, error);
					return ctx.stop;
				case 226: // flagged for spam
					console.log('--------- Flagged as spam ---------')
					console.log(msg, error);
					return ctx.stop;

				case 131:	// internal error - http 500
				case 88:	// rate limit exceeded
					return retry(msg, error, ctx);

				case 185: // User is over daily status update limit
					return retryDaily(msg, error, ctx);

				default: 
					console.log('Unknown twitter error: ', error);
				case 187:	// status is a duplicate
					console.log(msg, error);
					if(msg.i_want_the_error) {
						dispatch(msg.i_want_the_error, { type: msg.type, error }, ctx.self);
					}
					return ctx.resume;
			}
		}
	},

	actions: {
		'tweet_unclaimed_transfer': async (msg, ctx, state) => {
			const { twitter } = state;
			const { fromId, toId, amount, balance } = msg;
			const tweet = await twitter.postUnclaimedTransfer(fromId, toId, amount, balance);
			ctx.debug.d(msg, `tweeted '${tweet.text}'`);
			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'tweet_tip_seen': async (msg, ctx, state) => {
			const { twitter } = state;
			const { fromId, toId, amount } = msg;
			const tweet = await twitter.postUnclaimedTransfer(fromId, toId, amount);
			ctx.debug.d(msg, `tweeted '${tweet.text}'`);
			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'tweet_tip_confirmed': async (msg, ctx, state) => {
			const { twitter } = state;
			const { tip } = msg;

			ctx.debug.info(msg, `tweeting ${tip.id} success...`);
			const text = messageTemplates.twitter.tip_success_tweet_text(tip);
			const tweet = await twitter.postTweetReply(text, tip.id);
			ctx.debug.d(msg, `tweeted '${text}'`);

			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'tweet_tip_invalid': async (msg, ctx, state) => {
			const { twitter } = state;
			const { tip } = msg;

			ctx.debug.info(msg, `tweeting ${tip.id} invalid...`);
			let text = messageTemplates.twitter.tip_invalid_message(tip);
			if(tip.reason == 'broke') {
				text = messageTemplates.twitter.tip_broke_message(tip);
			} else if(tip.reason == 'unclaimed') {
				text = messageTemplates.twitter.tip_invalid_message(tip);
			} else {
				// No invalidation reason
			}
			const tweet = await twitter.postTweetReply(text, tip.id);
			ctx.debug.d(msg, `tweeted '${text}'`);

			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'tweet_tip_failed': async (msg, ctx, state) => {
			const { twitter } = state;
			const { tip } = msg;

			ctx.debug.info(msg, `tweeting ${tip.id} failure...`);
			const text = messageTemplates.twitter.tip_failure_message(tip);
			const tweet = await twitter.postTweetReply(text, tip.id);
			ctx.debug.d(msg, `tweeted '${text}'`);

			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'dm': (msg, context, state) => {
			// Direct message a user
		}
	}
});

module.exports = TweeterActor;
