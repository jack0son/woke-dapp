const { configure } = require('@woke/lib');
const tweets = require('./data/tweets-tips.json');
const { Status } = require('./data/tweet');

// @TODO tests are meaninless without expanding this dataset
// This should contain a sample of tweets that match the different search
// criteria being used
const dummyUsers = require('./data/users');
//tweets = tweets.slice(1,2);

const log = (...args) => console.log('TWITTER_FAKE', ...args);

const tipTweets = tweets.filter((t) => t.full_text.includes('+'));
// @param return a subset of the sample tweet data
const REQ_PER_EPOCH = 3;
const EPOCH = 3000;
const FakeClient = (sampleSize = 2, opts) => {
	const { data, ...conf } = configure(opts, {
		rateLimit: REQ_PER_EPOCH,
		epoch: EPOCH,
		data: tipTweets,
	});

	let tweetList = data;

	if (sampleSize !== undefined) {
		const start = 0;
		const end = start + sampleSize;
		tweetList = data.slice(start, end > data.length ? data.length : end);
	}

	// Simulate search
	const queryEngine = {
		match: async (query = '') => {
			var regex = new RegExp(query.replace(/ /g, '|'));
			// No AND only OR lol
			return tweetList.filter((t) => regex.test(t.full_text));
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

		async updateStatus(text, _params) {
			const { user, mention } = _params;
			if (!text) {
				throw new Error('Must provide status text');
			}

			if (!user) throw new Error('Must provide user');
			if (mention && !text.includes('@'))
				throw new Error('Status with mention must contain @ symbol');

			const tweet = Status(user, text, mention);
			tweetList.push(tweet);
			return tweet;
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
				log(`updateStatus: ${text}`);
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
