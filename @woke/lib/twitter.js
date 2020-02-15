const Twitter = require('twitter');
var request = require('request-promise-native');

const debug = require('./debug')('twitter');

require('dotenv').config();
const consumerKey = process.env.TWITTER_CONSUMER_KEY;
const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;

var client;

const initClient = async () => {
	let bearerToken = process.env.TWITTER_BEARER_TOKEN;

	if(bearerToken == undefined) {
		try {
			bearerToken = await getBearerToken(consumerKey, consumerSecret);
		} catch(e) {
			debug.d('Failed to retrieve bearer token')
			return process.exit(1);
		}
		debug.d(bearerToken);
	}

	client = new Twitter({
		consumer_key: consumerKey, 
		consumer_secret: consumerSecret,
		bearer_token: bearerToken, 
	});

	return;
}

const getUserTimeline = async (userId, count) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const params = {
		id: userId,
		trim_user: false,
		tweet_mode: 'extended',
		inlcude_entities: false,
		exclude_replies: false,
		count: 10,
	};

	let r = await client.get('statuses/user_timeline', params);

	if(r.length < 1) {
		throw new Error('No tweets found');
	}

	return r;
}

const CLAIM_FRAME = '0xWOKE:';
// TODO replace claimFrame with regex
// @param claimFrame: Text common to each claim string
const findClaimTweet = async (userId, claimFrame = CLAIM_FRAME) => {
	let latestTweets = await getUserTimeline(userId);
	let latest = latestTweets[0];
	if(latest.full_text && latest.full_text.includes(claimFrame)) {
		return latest.full_text;
	} else {
		for(let tweet of latestTweets.slice(1, latestTweets.length)) {
			//debug.d(tweet);
			if(tweet.full_text && tweet.full_text.includes(claimFrame)) {
				return tweet.full_text;
			}
		}
	}

	throw new Error('Could not find claim tweet');
}

const getUserData = async (userId) => {
	const params = {
		user_id: userId
	}

	let userObject = await client.get('users/show', params);

	return {
		name: userObject.name,
		handle: userObject.screen_name,
		avatar: userObject.profile_image_url_https,
	}
}

const searchClaimTweet = async (handle) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const searchParams = {
		//q: `@getwoketoke 0xWOKE from:${handle}`,
		q: `@getwoketoke from:${handle}`,
		result_type: 'recent',
		tweet_mode: 'extended',
		count: 1,
	};

	let r = await client.get('search/tweets', searchParams);
	debug.d(r);
	let tweets = r.statuses.map(s => s.full_text);
	if(tweets.length < 1) {
		throw new Error('No tweets found');
	}
	if(tweets.length > 1) {
		// Should never get here
		debug.d(tweets);
	}
	debug.d(tweets);
	return tweets[0];
}

// Application only authentiation
function getBearerToken(key, secret) {
	const authString = Buffer.from(encodeURI(key).concat(':', encodeURI(secret))).toString('base64');
	const opts = {
		url: 'https://api.twitter.com/oauth2/token/',
		headers: {
			'Authorization': 'Basic ' + authString,
			'Content-Type':  'application/x-www-form-urlencoded',
		},

		form: {
			'grant_type': 'client_credentials',
		}
	};

	return request.post(opts).then(resp => {
		resp = JSON.parse(resp);
		if(resp.access_token) {
			return resp.access_token;
		} else {
			throw new Error('Failed to retrieve bearer token');
		}
	});
}

module.exports = {initClient, findClaimTweet, getUserData}

// Example call
if(debug.debug.enabled && require.main === module) {
	//var argv = require('minimist')(process.argv.slice(2));
	var argv = process.argv.slice(2);
	const [handle, ...rest] = argv;
	debug.d(`Finding user: ${handle}`);

	(async () => {
		await initClient();
		//let r = await findClaimTweet(handle);
		try {
		let r = await getUserData(handle);
		//debug.d(`Found tweet: ${r}`);
		console.dir(r);
		} catch(error) {
			console.error(error);
		}
	})();
}
