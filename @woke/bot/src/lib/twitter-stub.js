const appUrl = 'https://getwoke.me';
const emojis = require('./emojis');

class TwitterStub {
	constructor(_client, _credentials) {
		const self = this;
		self.client = _client;
		//self.client = new _Client(_credentials);
	}

	async ready() {
		return true //this.client.hasCredentials();
	}

	// Errors: 
	// [ { code: 220, message: 'Your credentials do not allow access to this resource.' } ]

	async dm() {
		return true;
	}

	async postUnclaimedTransfer(fromId, toId, amount) {
		const { client } = this;

		const [fromUser, toUser] = await Promise.all([
			client.getUserData(fromId),
			client.getUserData(toId),
		]);

		const text = `${emojis.folded_hands} @${fromUser.handle} just sent you ${amount} $WOKE.\nGo to ${appUrl} to claim it! @${toUser.handle}`
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
			query: '$woke OR $WOKE OR $WOKENS OR WOKENS',
			result_type: 'recent',
			entities: 'false',
			count: 100,
			tweetMode: 'extended',
		}

		const amountRegex = /\+(\d+)\s*\$/
		try {
			const tips = await client.searchTweets(params)
			return tips.filter(t =>
				notRetweet(t) &&
				t.full_text.includes('+') && // @TODO replace with regex
				t.in_reply_to_user_id_str != null  &&
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

		} catch (error) {
			// Squash the error
			//error: {"error":"Sorry, your query is too complex. Please reduce complexity and try again."}.
			console.error(error);
			throw error;
		}

		return [];
	}
}

function notRetweet(tweet) {
	const rt = tweet.retweeted_status;
	return rt == undefined || rt == null || rt == false;
}

function nonEmptyArray(arr) {
	return arr && arr.length && arr.length && arr.length > 0;
}

module.exports = TwitterStub;
