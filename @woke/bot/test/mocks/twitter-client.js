// This should contain a sample of tweets that match the different search
// criteria being used

// @TODO tests are meaninless without expanding this dataset
const tweets = require('./tweets-tips.json');
const tipTweets = tweets.filter(t => t.full_text.includes('+'));

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const delay = 0;
const queryEngine = {
	match: async (query) => {
		return tweets.filter(t => t.full_text.includes('+'));
	}
}

class MockClient {
	constructor(_credentials) {
		this.credentials = _credentials
	}

	searchTweets(_params) {
		return queryEngine.match(_params.q);
	}
}

module.exports = {
	MockClient,
	data: {
		tweets,
		tipTweets,
	}
}
