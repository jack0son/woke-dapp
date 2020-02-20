class TwitterStub {
	constructor(_client, _credentials) {
		const self = this;
		self.client = _client;
		//self.client = new _Client(_credentials);
	}

	async ready() {
		return true //this.client.hasCredentials();
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
			count: 15,
			tweetMode: 'extended',
		}

		const amountRegex = /\+(\d+)\s\$/
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
