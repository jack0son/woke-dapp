const { dispatch } = require('nact');
const emojis = require('../lib/emojis');
const { Logger } = require('@woke/lib');
const debug = (msg, args) => Logger().name(`TWEET`, `${msg.type}>> ` + args);

const tx_etherscan_url = tip => `https://goerli.etherscan.io/tx/${tip.tx_hash}`;
const tip_tweet_url = tip =>  `https://twitter.com/${tip.fromId}/status/${tip.id}`;

function tip_success_tweet_text(tip) {
	return `${emojis.folded_hands} Wokeness confirmed : ${tx_etherscan_url(tip)}.\n\n@${tip.fromHandle} Sent @${tip.toHandle} ${tip.amount} $WOKE`;
}

function tip_success_message(tip) {
	return `${emojis.folded_hands} woke vote of ${tip.amount} was confirmed on chain: ${tx_etherscan_url(tip)}.\n\nTransaction auth tweet ${tip_tweet_url(tip)}`;
}

function tip_failure_message(tip) {
	return `${emojis.sleep_face} You need to be woke to send $WOKE. Join with a tweet at https://getwoke.me @${tip.fromHandle}`;
}

function tip_broke_message(tip) {
	return `${emojis.no} Broke. Spread some $WOKE @${tip.fromHandle}...`;
	//return `${emojis.no} You're broke, not woke. Spread some enlightenment @${tip.fromHandle}...`;
}


// Drives posting to twitter
const TweeterActor = (twitterStub) => ({
	properties: {
		initialState: {
			twitter: twitterStub,
		},

		onCrash: (msg, error, ctx) => {
			console.log(`Error processing message in actor ${ctx.self.name}`);
			console.log(msg);
			console.log(error);
			return ctx.resume;
		}
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

		'tweet_tip_invalid': async (msg, ctx, state) => {
			const { twitter } = state;
			const { tip } = msg;

			ctx.debug.d(msg, `tweeting ${tip.id} invalid...`);
			let text = tip_failure_message(tip);
			if(tip.reason == 'broke') {
				text = tip_broke_message(tip);
			} else if(tip.reason == 'unclaimed') {
				text = tip_failure_message(tip);
			} else {
				// No invalidation reason
			}
			const tweet = await twitter.postTweetReply(text, tip.id);

			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'tweet_tip_failed': async (msg, ctx, state) => {
			const { twitter } = state;
			const { tip } = msg;

			ctx.debug.d(msg, `tweeting ${tip.id} failure...`);
			const tweet = await twitter.postTweetReply(text, tip.id);

			dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
			// Tweet an invite
		},

		'dm': (msg, context, state) => {
			// Direct message a user
		}
	}
});

module.exports = TweeterActor;
