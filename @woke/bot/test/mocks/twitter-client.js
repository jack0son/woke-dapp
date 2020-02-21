// This should contain a sample of tweets that match the different search
// criteria being used

// @TODO tests are meaninless without expanding this dataset
let tweets = require('./tweets-tips.json');
//tweets = tweets.slice(1,2);
const tipTweets = tweets.filter(t => t.full_text.includes('+'));

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const delay = 0;

// @param return a subset of the sample tweet data
const createMockClient = (_sampleSize, _data) => {
	let data = _data ? _data : tipTweets;

	if(_sampleSize) {
		const start = 0;
		const end = start + _sampleSize;
		data = data.slice(start, end > data.length ? data.length : end);
	}

	const queryEngine = {
		match: async (query) => {
			return data.filter(t => t.full_text.includes('+'));
		}
	}

	class MockClient {
		constructor(_credentials) {
			this.credentials = _credentials;
		}

		searchTweets(_params) {
			return queryEngine.match(_params.q);
		}
	}

	return new MockClient();
}

module.exports = {
	createMockClient,
	data: {
		tweets,
		tipTweets,
	}
}
