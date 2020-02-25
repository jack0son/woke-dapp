const { dispatch } = require('nact');
const { Logger } = require('@woke/lib');
const debug = (msg, args) => Logger().name(`TWEET`, `${msg.type}>> ` + args);

const tx_etherscan_url = tip => `https://goerli.etherscan.io/tx/${tip.tx_hash}`;
const tip_tweet_url = tip =>  `https://twitter.com/${tip.fromId}/status/${tip.id}`;

function tip_success_tweet_text(tip) {
	return `Wokeness confirmed on chain: ${tx_etherscan_url(tip)}.\n\nSent @${tip.toHandle} ${tip.amount} WOKENS`;
}

function tip_success_message(tip) {
	return `Wokenation of ${tip.amount} was confirmed on chain: ${tx_etherscan_url(tip)}.\n\nTransaction auth tweet ${tip_tweet_url(tip)}`;
}

function tip_failure_message(tip) {
	return `Your Wokenation of ${tip.amount} failed. Are you woke yet? Join with a tweet at https://getwoke.me`;
}

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

		'tweet_tip_confirmed': async (msg, ctx, state) => {
			const { twitter } = state;
			const { tip } = msg;

			ctx.debug.d(msg, `tweeting ${tip.id} success...`);
			const tweet = await twitter.postTweetReply(tip_success_tweet_text(tip), tip.id);

			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'tweet_tip_failed': async (msg, ctx, state) => {
			const { twitter } = state;
			const { tip } = msg;

			ctx.debug.d(msg, `tweeting ${tip.id} failure...`);
			const tweet = await twitter.postTweetReply(tip_failure_message(tip), tip.id);

			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'dm': (msg, context, state) => {
			// Direct message a user
		}
	}
});

module.exports = TweeterActor;
