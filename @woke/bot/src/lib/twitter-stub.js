const appUrl = 'https://getwoke.me';
const emojis = require('./emojis');

// Errors: 
// [ { code: 220, message: 'Your credentials do not allow access to this resource.' } ]

class TwitterStub {
	constructor(_client, _credentials) {
		const self = this;
		self.client = _client;
		//self.client = new _Client(_credentials);
	}

	async ready() {
		return true //this.client.hasCredentials();
	}


	async dm() {
		return true;
	}

	async postUnclaimedTransfer(fromId, toId, amount, balance) {
		const { client } = this;

		const [fromUser, toUser] = await Promise.all([
			client.getUserData(fromId),
			client.getUserData(toId),
		]);

		const balanceStr = () => balance ? 
			`${balance} $WOKE with a tweet` :
			`your $WOKE with a tweet`;

		const text = `${emojis.folded_hands}@${toUser.handle}${emojis.folded_hands} you've been tributed ${amount} $WOKE from @${fromUser.handle}.\nGo to ${appUrl} to claim ${balanceStr()}.`
		try {
			const r = await client.updateStatus(text);
			return r;
		} catch(error) {
			switch(error.code) {
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
			const r = await client.updateStatus(text, {in_reply_to_status_id: replyStatusId});
			return r;
		} catch(error) {
			switch(error.code) {
				case 220: {
				}
				default: {
					throw error;
				}
			}
		}
	}

	// Best practice
	// -- Limit your searches to 10 keywords and operators.
	// -- 
	// Optional. Specifies what type of search results you would prefer to receive. The current default is "mixed." Valid values include:
	//    * mixed : Include both popular and real time results in the response.
	//    * recent : return only the most recent results in the response
	//    * popular : return only the most popular results in the response.
	//
	async findTips() {
		const { client } = this;

		const params = {
			query: '$woke OR $wokens OR $WOKE OR $WOKENS OR WOKENS',
			result_type: 'recent',
			entities: 'false',
			count: 100,
			tweetMode: 'extended',
		}

		try {
			const tweets = await client.searchTweets(params)
			return this.filterTipTweets(tweets);

		} catch (error) {
			// Squash the error
			//error: {"error":"Sorry, your query is too complex. Please reduce complexity and try again."}.
			console.error(error);
			throw error;
		}

		return [];
	}

	// @NB if @mention starts the tweet text, in_reply_to_user_id_str will not be
	// null
	filterTipTweets(tweets) {
		const amountRegex = /\+(\d+)\s*\$/
		return tweets.filter(t =>
			notRetweet(t) &&
			t.full_text.includes('+') && // @TODO replace with regex
			//t.in_reply_to_user_id_str != null  &&
			nonEmptyArray(t.entities.user_mentions)
		).filter(t => {
			const matches = t.full_text.match(amountRegex);
			const amount = matches && matches[1] ? parseInt(matches[1]) : false;
			if(amount && amount !== NaN && amount > 0) {
				t.tip_amount = amount;
				return true
			}
			return false;
		});
	}
}


function notRetweet(tweet) {
	const rt = tweet.retweeted_status;
	return rt == undefined || rt == null || rt == false;
}

function nonEmptyArray(arr) {
	return arr && arr.length && arr.length > 0;
}

module.exports = TwitterStub;
