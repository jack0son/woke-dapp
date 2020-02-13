// This should contain a sample of tweets that match the different search
// criteria being used
const tweets = [
	'heres a tweet',
	'heres a woke tweet',
];

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const delay = 0;
const queryEngine = {
	match: async (query, data) => {
		if(delay > 0) 
			await sleep(delay);
		return data;
	}
}

class MockClient {
	constructor(_credentials) {
		this.credentials = _credentials
	}

	searchTweets(_query) {
		return queryEngine.match(_query, tweets);
	}
}

module.exports = {
	MockClient,
	data: {
		tweets
	}
}
