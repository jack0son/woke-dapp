const { dispatch } = require('nact');
const { Logger } = require('@woke/lib');
const debug = (msg, args) => Logger().name(`TWEET`, `${msg.type}>> ` + args);
// Drives posting to twitter
const TweeterActor = (twitterStub) => ({
	properties: {
		initialState: {
			twitter: twitterStub,
		},

		//onCrash: exponentialRetry
	},

	actions: {
		'tweet_unclaimed_transfer': async (msg, ctx, state) => {
			const { twitter } = state;
			const { fromId, toId, amount } = msg;
			const tweet = await twitter.postUnclaimedTransfer(fromId, toId, amount);
			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'dm': (msg, context, state) => {
			// Direct message a user
		}
	}
});

module.exports = TweeterActor;
