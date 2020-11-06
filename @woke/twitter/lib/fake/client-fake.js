const { configure, Logger } = require('@woke/lib');
const tweets = require('./data/tweets-tips.json');
const { Status } = require('./data/tweet');
const debug = Logger('twitter:fake');

// @TODO tests are meaninless without expanding this dataset
// This should contain a sample of tweets that match the different search
// criteria being used
const dummyUsers = require('./data/users');
//tweets = tweets.slice(1,2);

const tipTweets = tweets.filter((t) => t.full_text.includes('+'));
// @param return a subset of the sample tweet data
const REQ_PER_EPOCH = 100;
const EPOCH = 1000;
const FakeClient = (sampleSize = 2, opts) => {
	const { data, ...conf } = configure(opts, {
		rateLimit: REQ_PER_EPOCH,
		epoch: EPOCH,
		data: tipTweets,
		users: {},
	});

	const users = { ...dummyUsers, ...conf.users };

	let tweetList = data;

	if (sampleSize !== undefined) {
		const start = 0;
		const end = start + sampleSize;
		tweetList = data.slice(start, end > data.length ? data.length : end);
	}

	// Simulate search
	const queryEngine = {
		match: async (query = '', userId) => {
			var regex = new RegExp(query.replace(/ /g, '|'));
			// No AND only OR lol, spaces are ANDS in twitter search

			return tweetList.filter((t) => {
				return userId
					? t.id_str === userId && regex.test(t.full_text)
					: regex.test(t.full_text);
			});
		},

		// @TODO REPLACE THIS TRASH
		timeline: async (userId, subString) =>
			tweetList.filter((t) => {
				return t.user.id_str === userId && t.full_text.includes(subString);
			}),
	};

	// e.g. Search is 180 per user per 15 min window
	const twitterErrors = {
		duplicate: { code: 187, message: 'Status is a duplicate.' },
		rateLimit: { code: 88, message: 'Rate limit exceeded' },
		// rateLimit: [{ code: 88, message: 'Rate limit exceeded' }],
	};

	class ApiError extends Error {
		constructor({ code, message }) {
			super(message);
			this.name = this.constructor.name;
			this.code = code;
			Error.captureStackTrace(this, this.constructor);
		}
	}

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
					console.log({ requests });
					console.log({ limit });
					reject(new ApiError(twitterErrors.rateLimit));
				}
			});
	};

	class FakeClient {
		constructor(_credentials) {
			this.credentials = _credentials;
			this.request = rateLimiter();
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
			return this.request(tweet).then((r) => {
				debug.d(`updateStatus: ${text}`);
				return { data: r };
			});
		}

		async searchTweets(_params) {
			return this.request(queryEngine.match(_params.q));
		}

		async getUserData(userId) {
			const user = users[userId];
			return this.request(user ? user : users['0']);
		}

		async getUserTimeline(userId) {
			const user = users[userId];
			const r = queryEngine.timeline(userId, '0xWOKE');

			return this.request(r);
		}

		// async updateStatus(text, params) {
		// 	return this.request(dummyStatus).then((r) => {
		// 		log(`updateStatus: ${text}`);
		// 		return { data: r };
		// 	});
		// }
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
