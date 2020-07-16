const Twitter = require('twitter');
const fs = require('fs');
var request = require('request-promise-native');

const debug = require('./debug')('twitter');

require('dotenv').config();
const consumerKey = process.env.TWITTER_CONSUMER_KEY;
const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;

const accessKey = process.env.TWITTER_ACCESS_KEY;
const accessSecret = process.env.TWITTER_ACCESS_SECRET;

var client;

const initClient = async () => {
	let bearerToken = process.env.TWITTER_BEARER_TOKEN;

	if(bearerToken == undefined) {
		try {
			bearerToken = await getBearerToken(consumerKey, consumerSecret);
			//console.log('Bearer token:', bearerToken);
		} catch(e) {
			debug.d('Failed to retrieve bearer token')
			return process.exit(1);
		}
		debug.d(bearerToken);
	}

	const conf = {
		consumer_key: consumerKey, 
		consumer_secret: consumerSecret,
		access_token_key: accessKey, 
		access_token_secret: accessSecret,
		//bearer_token: bearerToken, 
	};
	client = new Twitter(conf);

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
		...userObject,
		name: userObject.name,
		handle: userObject.screen_name,
		avatar: userObject.profile_image_url_https,
		followers_count: userObject.followers_count,
	}
}

function statusUrl(status) {
	return `https://twitter.com/${status.user.id_str}/status/${status.id_str}`
}

// Rate limit: 1000 per user; 15000 per app
const directMessage = (recipientId, text) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	if(!recipientId) {
		throw new Error('Must provide a recipient ID');
	}

	if(!text) {
		throw new Error('Must provide message text');
	}

	const event = {
		type: 'message_create',
		message_create: {
			target: {
				recipient_id: recipientId,
			},
			message_data: {
				text: text,
			}
		},
	};

	const params = { event };

	return client.post('direct_messages/events/new', params).then(r => {
		console.log(r);
		return r;
	});
}

const updateStatus = (text, _params) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	if(!text) {
		throw new Error('Must provide status text');
	}

	const params = {
		..._params,
		status: text,
	};

	// For each update attempt, the update text is compared with the authenticating user's recent Tweets. Any attempt that would result in duplication will be blocked, resulting in a 403 error. A user cannot submit the same status twice in a row.

  // While not rate limited by the API, a user is limited in the number of Tweets they can create at a time. If the number of updates posted by the user reaches the current allowed limit this method will return an HTTP 403 error.
	return client.post('statuses/update', params).then(r => {
		//console.log(r);
		return r;
	});
}

const getStatus = (id, _params) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;

	const params = {
		..._params,
		id,
	};
	return client.get('statuses/show', params).then(r => {
		return r;
	});
}


const searchTweets = (params) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const searchParams = {
		q: '$woke OR $WOKE OR $WOKENS OR WOKENS',
		result_type: 'recent',
		tweet_mode: 'extended',
		count: 10,
		...params,
	};

	return client.get('search/tweets', searchParams).then(r => {
		debug.d(`Found ${r.statuses.length || 0} tweets for query '${searchParams.q}'`);
		return r.statuses;
	});
}

const searchClaimTweets = async (handle) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const searchParams = {
		//q: `@getwoketoke 0xWOKE from:${handle}`,
		q: handle ? `@getwoketoke from:${handle}` : `@getwoketoke OR 0xWOKE`,
		result_type: 'recent',
		include_entities: true,
		tweet_mode: 'extended',
		count: 100,
	};

	let r = await client.get('search/tweets', searchParams);
	let tweets = r.statuses.map(s => ({
		full_text: s.full_text,
		entities: s.entities,
	}));
	if(tweets.length < 1) {
		throw new Error('No tweets found');
	}
	if(tweets.length > 1) {
		//debug.d(tweets);
	}
	//debug.d(tweets);
	return tweets;
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

module.exports = {
	initClient,
	directMessage,
	searchClaimTweets,
	findClaimTweet,
	getUserData,
	searchTweets,
	updateStatus
}

// Example call
if(debug.control.enabled && require.main === module) {
	//var argv = require('minimist')(process.argv.slice(2));
	var argv = process.argv.slice(2);
	const [command, ...args] = argv;
	debug.d(`Command: ${command}`);
	debug.d(`Args: ${args}`);

	(async () => {
		await initClient();
		//let r = await findClaimTweet(handle);
		try {
			switch(command) {
				case 'user': {
					const [userId] = args;
					let r = await getUserData(userId);
					//debug.d(`Found tweet: ${r}`);
					console.dir(r);
					break;
				}

				case 'get': {
					const [tweetId] = args;
					let r = await getStatus(tweetId);
					//r = r.filter(t => t.retweeted_status);
					console.dir(r, {depth: 10});
					break;
				}

				case 'search': {
					const [query] = args;
					let r = await searchTweets(query ? {q: query} : undefined);
					//r = r.filter(t => t.retweeted_status);
					r.forEach(t => {
						console.log(statusUrl(t));
						console.log(t.user.screen_name);
						console.log(t.full_text);
						console.log(t.entities.user_mentions);
						console.log('retweeted', t.retweeted_status);
						//console.log(t);
						console.log();
					})
					//console.dir(r);
					break;
				}

				case 'tips': {
					const [time] = args;
					let r = await searchTweets({ q: '$woke OR $WOKE OR $WOKENS OR WOKENS'});
					r = r.filter(t => t.full_text.includes('+'));
					r.forEach(t => {
						console.log(statusUrl(t));
						console.log('handle: ', t.user.screen_name);
						console.log(t.full_text);
						console.log();
					})

					fs.writeFileSync('tweets-tips.json', JSON.stringify(r));
					break;
				}

				case 'status': {
					const [text] = args;
					const defaultText = 'test tweet';

					let r = await updateStatus(text ? text : defaultText);
					console.log(r);
					break;
				}

				case 'dm': {
					const [recipient, text] = args;
					const defaultText = 'test dm';

					let r = await directMessage(recipient, text ? text : defaultText);
					console.log(r);
					break;
				}

				default: {
				}

				case 'claim': {
					const [handle] = args;
					let r = await searchClaimTweets(handle);
					r.forEach(t => {
						console.log(t);
						console.log(t.full_text);
						console.log(t.entities.user_mentions);
						console.log();
					})
					break;
				}
			}
		} catch(error) {
			console.error(error);
		}
		return;
	})();
}
