const { configure } = require('@woke/lib');
const tweets = require('./data/tweets-tips.json');

// @TODO tests are meaninless without expanding this dataset
// This should contain a sample of tweets that match the different search
// criteria being used
const dummyUsers = require('./data/users');
//tweets = tweets.slice(1,2);

const tipTweets = tweets.filter((t) => t.full_text.includes('+'));
// @param return a subset of the sample tweet data
const REQ_PER_EPOCH = 3;
const EPOCH = 3000;
const FakeClient = (sampleSize, opts) => {
	const { data, ...conf } = configure(opts, {
		rateLimit: REQ_PER_EPOCH,
		epoch: EPOCH,
		data: tipTweets,
	});

	let tweetList = data;

	if (sampleSize) {
		const start = 0;
		const end = start + sampleSize;
		tweetList = data.slice(start, end > data.length ? data.length : end);
	}

	// Simulate search
	const queryEngine = {
		match: async (query = '') => {
			var regex = new RegExp(query.replace(/ /g, '|'));
			console.log(regex);
			// No AND only OR lol
			return data.filter((t) => regex.test(t.full_text));
		},
	};

	// e.g. Search is 180 per user per 15 min window
	const twitterErrors = {
		duplicate: [{ code: 187, message: 'Status is a duplicate.' }],
		rateLimit: [{ code: 88, message: 'Rate limit exceeded' }],
	};

	const rateLimiter = (limit = conf.rateLimit) => {
		let requests = 0;
		setInterval(() => {
			requests = 0;
		}, conf.epoch);
		return (resp) =>
			new Promise((resolve, reject) => {
				if (requests++ < limit) {
					resolve(resp);
				} else {
					reject(twitterErrors.rateLimit);
				}
			});
	};

	class FakeClient {
		constructor(_credentials, limitPerMin) {
			this.credentials = _credentials;
			this.request = rateLimiter(limitPerMin);
		}

		isConnected() {
			return true;
		}

		async searchTweets(_params) {
			return this.request(queryEngine.match(_params.q));
		}

		async getUserData(userId) {
			const user = dummyUsers[userId];
			return this.request(user ? user : dummyUsers['0']);
		}

		async updateStatus(text, params) {
			return this.request(dummyStatus).then((r) => {
				console.log(`TWITTER_MOCK:updateStatus: ${text}`);
				return { data: r };
			});
		}
	}

	return new FakeClient();
};

module.exports = {
	FakeClient,
	data: {
		tweets,
		tipTweets,
	},
};
