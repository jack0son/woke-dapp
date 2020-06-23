const { emojis } = require('@woke/lib');

const tip_submitted = (tip) => `Tip submitted: @${tip.fromHandle} wishes to tip @${tip.toHandle} ${tip.amount} WOKENS (#${tip.id})`;

function tip_success_tweet_text(tip) {
	return `${emojis.folded_hands} Tribute confirmed, @${tip.fromHandle} sent @${tip.toHandle} ${tip.amount} $WOKE. \n\n${tx_etherscan_url(tip)} #WokeTribute`;
}

function tip_seen_text(tip) {
	return `@${tip.fromHandle} I accept your offering. #tribute #${tip.id}`;
}

function tip_success_message(tip) {
	return `${emojis.folded_hands} #WokeTribute of ${tip.amount} wokens was confirmed on chain: ${tx_etherscan_url(tip)}.\n\nTransaction auth tweet ${tip_tweet_url(tip)}`;
}

function tip_invalid_message(tip) {
	return `${emojis.sleep_face} You need to be woke to send $WOKE. Join https://getwoke.me with a tweet \n@${tip.fromHandle}`;
}

function tip_failure_message(tip) {
	return `${emojis.shrug} Wokens be damned! #WokeTribute failed. \n\n@${tip.fromHandle}#${tip.id}`;
}

function tip_broke_message(tip) {
	return `${emojis.no} Broke. Spread some $WOKE @${tip.fromHandle}...`;
	//return `${emojis.no} You're broke, not woke. Spread some enlightenment @${tip.fromHandle}...`;
}

const tx_etherscan_url = tip => `https://goerli.etherscan.io/tx/${tip.tx_hash}`;
const tip_tweet_url = tip =>  `https://twitter.com/${tip.fromId}/status/${tip.id}`;

module.exports = {
	twitter: {
		tip_success_tweet_text,
		tip_success_tweet_text,
		tip_seen_text,
		tip_success_message,
		tip_invalid_message,
		tip_failure_message,
		tip_broke_message,
	},

	console: {
		tip_submitted,
	},

	url: {
		tx_etherscan_url,
		tip_tweet_url,
	}
}
