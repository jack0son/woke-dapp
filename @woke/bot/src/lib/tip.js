function parseTweetToTip(tweet) {
	return {
		id: tweet.id_str,
		fromId: tweet.user.id_str,
		fromHandle: tweet.user.screen_name,
		//toId: tweet.entities.user_mentions[0].id_str,

		// This is correct for both replies AND tweets mentioning a user.
		//toId: tweet.in_reply_to_user_id_str,
		toId: tweet.entities.user_mentions[0].id_str,
		toHandle: tweet.entities.user_mentions[0].screen_name,
		full_text: tweet.full_text,
		amount: tweet.tip_amount,
	};
}

module.exports = { parseTweetToTip };
