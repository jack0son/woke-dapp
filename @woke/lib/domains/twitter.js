const j0 = require('@woke/jack0son');
const emojis = require('../emojis');
//const twitClient = require('../twitter/client');
const { notRetweet } = require('../helpers/twitter');
const Logger = require('../debug');
const debug = Logger('domain:twitter');

const appUrl = 'https://getwoke.me';
const CLAIM_FRAME = '0xWOKE:';

const filterTipTweets = (tweets) => {
	const amountRegex = /\+(\d+)\s*\$/;
	return tweets
		.filter(
			(t) =>
				notRetweet(t) &&
				t.full_text.includes('+') && // @TODO replace with regex
				//t.in_reply_to_user_id_str != null  &&
				j0.notEmpty(t.entities.user_mentions)
		)
		.filter((t) => {
			const matches = t.full_text.match(amountRegex);
			const amount = matches && matches[1] ? parseInt(matches[1]) : false;
			if (amount && amount !== NaN && amount > 0) {
				t.tip_amount = amount;
				return true;
			}
			return false;
		});
};

// Errors:
// [ { code: 220, message: 'Your credentials do not allow access to this resource.' } ]

// Interactions with the twitter API bundled into useful functions
class TwitterDomain {
	constructor(client, credentials) {
		this.client = client && !credentials ? client : require('@woke/twitter').client;
		//this.client = client;
		if (!this.client)
			console.warn('WARNING: twitter domain does not have twitter client');
		if (!!credentials) this.client.init(credentials);
	}

	init() {
		if (!this.ready()) return this.client.init();
	}

	ready() {
		return this.client.isConnected();
	}

	async findClaimTweet(userId) {
		const { client } = this;
		let userData = {};
		try {
			userData = await client.getUserData(userId);
		} catch (error) {
			debug.error(error);
			throw new Error(`User ${userId} not found`);
		}

		const searchParams = {
			q: userData.handle
				? `@getwoketoke from:${userData.handle}`
				: `@getwoketoke OR 0xWOKE`,
			result_type: 'recent',
			include_entities: true,
			tweet_mode: 'extended',
			count: 100,
		};

		//let tweets = await client.searchClaimTweets(userData.handle);
		let tweets = await client.searchTweets(searchParams);
		if (tweets.length < 1) {
			throw new Error('No claim tweet found');
		}

		//let tweet = tweets[0].full_text;
		let tweet = tweets[0];
		debug.d(`Found tweet: ${tweet.full_text}`);
		return { tweet, userData };
	}

	async postDirectMessage(recipientId, text) {
		const { client } = this;
		return client.directMessage(recipientId, text);
	}

	async postUnclaimedTransfer(fromId, toId, amount, balance) {
		const { client } = this;

		const [fromUser, toUser] = await Promise.all([
			client.getUserData(fromId),
			client.getUserData(toId),
		]);

		const balanceStr = () =>
			balance ? `${balance} $WOKE with a tweet` : `your $WOKE with a tweet`;

		const text = `${emojis.folded_hands}@${toUser.handle}${
			emojis.folded_hands
		} you've been tributed ${amount} $WOKE from @${
			fromUser.handle
		}.\nGo to ${appUrl} to claim ${balanceStr()}.`;
		try {
			const r = await client.updateStatus(text);
			return r.data;
		} catch (error) {
			switch (error.code) {
				case 220: {
				}
				default: {
					throw error;
				}
			}
		}
	}

	async postTweetReply(text, replyStatusId) {
		const { client } = this;

		try {
			const r = await client.updateStatus(text, { in_reply_to_status_id: replyStatusId });
			return r;
		} catch (error) {
			switch (error.code) {
				case 220: {
				}
				default: {
					throw error;
				}
			}
		}
	}

	// Best practice (from the twitter docs)
	// -- Limit your searches to 10 keywords and operators.
	// --
	// Optional. Specifies what type of search results you would prefer to receive. The current default is "mixed." Valid values include:
	//    * mixed : Include both popular and real time results in the response.
	//    * recent : return only the most recent results in the response
	//    * popular : return only the most popular results in the response.
	//
	async findTips() {
		const { client } = this;
		// @NB if @mention starts the tweet text, in_reply_to_user_id_str will not be
		// null

		const params = {
			query: '$woke OR $wokens OR $WOKE OR $WOKENS OR WOKENS',
			result_type: 'recent',
			entities: 'false',
			count: 100,
			tweetMode: 'extended',
		};

		try {
			const tweets = await client.searchTweets(params);
			return filterTipTweets(tweets);
		} catch (error) {
			// Squash the error
			//error: {"error":"Sorry, your query is too complex. Please reduce complexity and try again."}.
			console.error(error);
			throw error;
		}

		return [];
	}
	// TODO replace claimFrame with regex
	// @param claimFrame: Text common to each claim string
	async findClaimTweetFromTimeline(userId, claimFrame = CLAIM_FRAME) {
		let latestTweets = await this.getUserTimeline(userId);
		let latest = latestTweets[0];
		if (latest.full_text && latest.full_text.includes(claimFrame)) {
			return latest.full_text;
		} else {
			for (let tweet of latestTweets.slice(1, latestTweets.length)) {
				//debug.d(tweet);
				if (tweet.full_text && tweet.full_text.includes(claimFrame)) {
					return tweet.full_text;
				}
			}
		}

		throw new Error('Could not find claim tweet');
	}
}

module.exports = TwitterDomain;
