// This should contain a sample of tweets that match the different search
// criteria being used

// @TODO tests are meaninless without expanding this dataset
let tweets = require('./tweets-tips.json');
//tweets = tweets.slice(1,2);
const tipTweets = tweets.filter(t => t.full_text.includes('+'));

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const delay = 0;

const dummyUsers = {
	'932596541822418944': {
		name: 'Get Woke Toke',
		handle: 'getwoketoke',
		avatar: undefined,
	},

	'1177602175955922945': {
		name: 'Mr Wokens',
		handle: 'getwokens',
		avatar: undefined,
	},

	'0': {
		name: 'Unknown User',
		handle: 'unknown',
		avatar: undefined,
	},
}


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

	// e.g. Search is 180 per user per 15 min window
	const REQ_PER_MIN = 3;
	const EPOCH = 3000;
	const twitterErrors = {
		duplicate: [ { code: 187, message: 'Status is a duplicate.' } ],
		rateLimit: [ { code: 88, message: 'Rate limit exceeded' } ],
	}

	const rateLimiter = (limit = REQ_PER_MIN) => {
		let requests = 0;
		setInterval(() => {requests = 0}, EPOCH)
		return (resp) => new Promise((resolve, reject) => {
			if(requests++ < limit) {
				resolve(resp);
			} else {
				reject(twitterErrors.rateLimit)
			}
		})
	}

	class MockClient {
		constructor(_credentials, limitPerMin) {
			this.credentials = _credentials;
			this.request = rateLimiter(limitPerMin)
		}

		async searchTweets(_params) {
			return this.request(queryEngine.match(_params.q));
		}

		async getUserData(userId) {
			const user = dummyUsers[userId];

			return this.request(user ? user : dummyUsers['0']);
		}

		async updateStatus(text, params) {
			return this.request(dummyStatus).then(r => {
				console.log(`TWITTER_MOCK:updateStatus: ${text}`);
				return r;
			});
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

const dummyStatus = {
	created_at: 'Tue Feb 25 06:21:41 +0000 2020',
  id: 1232188898765201400,
  id_str: '1232188898765201409',
  text: 'this is the text of an example status update response',
  truncated: false,
  entities: { hashtags: [], symbols: [], user_mentions: [], urls: [] },
  source:
   '<a href="https://getwoke.me" rel="nofollow">WokeNetwork - Bot</a>',
  in_reply_to_status_id: null,
  in_reply_to_status_id_str: null,
  in_reply_to_user_id: null,
  in_reply_to_user_id_str: null,
  in_reply_to_screen_name: null,
  user:
   { id: 932596541822419000,
     id_str: '932596541822418944',
     name: 'Get Woke',
     screen_name: 'getwoketoke',
     location: '',
     description: '',
     url: null,
     entities: { description: [Object] },
     protected: false,
     followers_count: 9,
     friends_count: 57,
     listed_count: 0,
     created_at: 'Mon Nov 20 13:08:37 +0000 2017',
     favourites_count: 9,
     utc_offset: null,
     time_zone: null,
     geo_enabled: false,
     verified: false,
     statuses_count: 9,
     lang: null,
     contributors_enabled: false,
     is_translator: false,
     is_translation_enabled: false,
     profile_background_color: 'F5F8FA',
     profile_background_image_url: null,
     profile_background_image_url_https: null,
     profile_background_tile: false,
     profile_image_url:
      'http://pbs.twimg.com/profile_images/1168463843997057025/R4vaa4oI_normal.jpg',
     profile_image_url_https:
      'https://pbs.twimg.com/profile_images/1168463843997057025/R4vaa4oI_normal.jpg',
     profile_link_color: '1DA1F2',
     profile_sidebar_border_color: 'C0DEED',
     profile_sidebar_fill_color: 'DDEEF6',
     profile_text_color: '333333',
     profile_use_background_image: true,
     has_extended_profile: false,
     default_profile: true,
     default_profile_image: false,
     following: false,
     follow_request_sent: false,
     notifications: false,
     translator_type: 'none' },
  geo: null,
  coordinates: null,
  place: null,
  contributors: null,
  is_quote_status: false,
  retweet_count: 0,
  favorite_count: 0,
  favorited: false,
  retweeted: false,
  lang: 'en' 
}
