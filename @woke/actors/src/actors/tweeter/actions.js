const { ActorSystem } = require('@woke/wact');
const { messageTemplates } = require('@woke/lib');
const { start_actor, dispatch, query } = ActorSystem;

const tipInvalidText = (tip) => {
	let text = messageTemplates.twitter.tip_invalid_message(tip);
	if (tip.reason == 'broke') {
		text = messageTemplates.twitter.tip_broke_message(tip);
	} else if (tip.reason == 'unclaimed') {
		text = messageTemplates.twitter.tip_invalid_message(tip);
	} else {
		// No invalidation reason
	}
	return text;
};

// Good example of an actor that could just use the Nactor primitive
async function action_tweet(state, msg, ctx) {
	const { twitter } = state;
	const { tip, tweetType } = msg;
	const { fromId, toId, amount, balance } = tip;

	let tweet;
	switch (tweetType) {
		case 'unclaimed-transfer': {
			tweet = await twitter.postUnclaimedTransfer(fromId, toId, amount, balance);
			break;
		}

		case 'tip-confirmed': {
			tweet = await twitter.postTweetReply(
				messageTemplates.twitter.tip_success_tweet_text(tip),
				tip.id
			);
			// @TODO Tweet an invite
			break;
		}

		case 'tip-failed': {
			tweet = await twitter.postTweetReply(
				messageTemplates.twitter.tip_failure_message(tip),
				tip.id
			);
			break;
		}

		case 'tip-invalid': {
			tweet = await twitter.postTweetReply(tipInvalidText(tip), tip.id);
			break;
		}

		case 'tip-seen':
		default:
			ctx.debug.warn(msg, `Unknown tweet type: ${tweetType}`);
			return;
	}
	dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
	ctx.debug.d(msg, `tweeted '${tweet.text}'`);
}

async function action_sendDirectMessage(state, msg, ctx) {
	const { twitter } = state;
	const { recipientId, text } = msg;
	const result = await twitter.postDirectMessage(recipientId, text);

	dispatch(ctx.sender, { type: msg.type, result }, ctx.self);
}

module.exports = {
	action_tweet,
	action_sendDirectMessage,
};
