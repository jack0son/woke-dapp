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

function isInternalError() {
	// Not important for now
}

async function action_tweet(state, msg, ctx) {
	const { twitterDomain: td } = state;
	const { tip, tweetType } = msg;
	const { fromId, toId, amount, balance } = tip;

	let tweet, text;
	try {
		switch (tweetType) {
			case 'unclaimed-transfer': {
				tweet = await td.postUnclaimedTransfer(fromId, toId, amount, balance);
				break;
			}

			case 'tip-confirmed': {
				text = messageTemplates.td.tip_success_tweet_text(tip);
				tweet = await td.postTweetReply(text, tip.id);
				// @TODO Tweet an invite
				break;
			}

			case 'tip-failed': {
				text = messageTemplates.td.tip_failure_message(tip);
				tweet = await td.postTweetReply(text, tip.id);
				break;
			}

			case 'tip-invalid': {
				text = tipInvalidText(tip);
				tweet = await td.postTweetReply(text, tip.id);
				break;
			}

			case 'tip-seen':
			default:
				ctx.debug.warn(msg, `Unknown tweet type: ${tweetType}`);
				return;
		}
		dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
		ctx.debug.d(msg, `tweeted '${tweet.text}'`);
	} catch (error) {
		ctx.debug.error(msg, error);
		text && ctx.debug.warn(msg, `Unable to tweet text: ${text}`);
		throw error;
	}
}

async function action_sendDirectMessage(state, msg, ctx) {
	const { twitterDomain: td } = state;
	const { recipientId, text } = msg;
	const result = await td.postDirectMessage(recipientId, text);

	dispatch(ctx.sender, { type: msg.type, result }, ctx.self);
}

module.exports = {
	action_tweet,
	action_sendDirectMessage,
};
