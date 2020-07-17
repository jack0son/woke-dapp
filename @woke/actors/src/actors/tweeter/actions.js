const { ActorSystem } = require('@woke/wact');
const { messageTemplates } = require('@woke/lib');
const { start_actor, dispatch, query } = ActorSystem;

async function action_tweetUnclaimedTransfer(msg, ctx, state) {
	//'tweet_unclaimed_transfer': async (msg, ctx, state) => {
	const { twitter } = state;
	const { fromId, toId, amount, balance } = msg;
	const tweet = await twitter.postUnclaimedTransfer(fromId, toId, amount, balance);
	ctx.debug.d(msg, `tweeted '${tweet.text}'`);
	dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
}

async function action_tweetTipSeen(msg, ctx, state) {
	//'tweet_tip_seen': async (msg, ctx, state) => {
	const { twitter } = state;
	const { fromId, toId, amount } = msg;
	const tweet = await twitter.postUnclaimedTransfer(fromId, toId, amount);
	ctx.debug.d(msg, `tweeted '${tweet.text}'`);
	dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
	// Tweet an invite
}

async function action_tweetTipConfirmed(msg, ctx, state) {
	//	'tweet_tip_confirmed': async (msg, ctx, state) => {
	const { twitter } = state;
	const { tip } = msg;

	ctx.debug.info(msg, `tweeting ${tip.id} success...`);
	const text = messageTemplates.twitter.tip_success_tweet_text(tip);
	const tweet = await twitter.postTweetReply(text, tip.id);
	ctx.debug.d(msg, `tweeted '${text}'`);

	dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
	// Tweet an invite
}	

async function action_tweetTipInvalid(msg, ctx, state) {
	//'tweet_tip_invalid': async (msg, ctx, state) => {
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
}

async function action_tweetTipFailed(msg, ctx, state) {
	//'tweet_tip_failed': async (msg, ctx, state) => {
	const { twitter } = state;
	const { tip } = msg;

	ctx.debug.info(msg, `tweeting ${tip.id} failure...`);
	const text = messageTemplates.twitter.tip_failure_message(tip);
	const tweet = await twitter.postTweetReply(text, tip.id);
	ctx.debug.d(msg, `tweeted '${text}'`);

	dispatch(ctx.sender, { type: msg.type, tweet }, ctx.self);
	// Tweet an invite
}

async function action_sendDirectMessage(msg, ctx, state) {
	const { twitter } = state;
	const { recipientId, text } = msg;
	const result = await twitter.postDirectMessage(recipientId, text);

	dispatch(ctx.sender, { type: msg.type, result }, ctx.self);
}

module.exports = {
 action_tweetUnclaimedTransfer,
 action_tweetTipSeen,
 action_tweetTipConfirmed,
 action_tweetTipInvalid,
 action_tweetTipFailed,
 action_sendDirectMessage,
};
