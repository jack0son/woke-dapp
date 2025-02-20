const Twit = require('twit');
const request = require('request-promise-native');
const debug = require('@woke/lib').Logger('twitter:client');

const loadEnvConf = () => ({
	consumerKey: process.env.TWITTER_CONSUMER_KEY,
	consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
	accessKey: process.env.TWITTER_ACCESS_KEY,
	accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// @NB Swapping twitter client lib to twit
// Reponse obeject is no longer just the response data
// Twit response object: { data, resp }

// API response handlers
const handlers = {
	dataOnly: ({ data }) => data,
};

var client;

const init = async () => {
	const conf = loadEnvConf();
	let bearerToken = process.env.TWITTER_BEARER_TOKEN;

	if (!bearerToken && !conf.accessKey && !conf.accessSecret) {
		//if(!bearerToken && ) {
		try {
			bearerToken = await getBearerToken(conf.consumerKey, conf.consumerSecret);
			//console.log('Bearer token:', bearerToken);
		} catch (e) {
			console.log('twitter: Failed to retrieve bearer token');
			return process.exit(1);
		}
		debug.d(bearerToken);
	}

	let creds = {
		consumer_key: conf.consumerKey,
		consumer_secret: conf.consumerSecret,
		bearer_token: bearerToken,
	};

	if (!!conf.accessKey && !!conf.accessSecret) {
		creds = {
			...creds,
			access_token: conf.accessKey,
			access_token_secret: conf.accessSecret,
		};
	} else {
		creds = { ...creds, app_only_auth: true };
	}

	client = new Twit(creds);
};

const getUserTimeline = (userId, count) => {
	// claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const params = {
		id: userId,
		trim_user: false,
		tweet_mode: 'extended',
		inlcude_entities: false,
		exclude_replies: false,
		count: count || 10,
	};

	return client.get('statuses/user_timeline', params).then(({ data }) => {
		if (data.lenth < 1) throw new Error('No tweets found');
		return data;
	});
	//let { data } = await client.get('statuses/user_timeline', params);
	// if (data.length < 1) {
	// 	throw new Error('No tweets found');
	// }
	// return r;
};

const getUserData = (userId) => {
	const params = {
		user_id: userId,
		include_entities: true,
		tweet_mode: 'extended',
	};

	return client.get('users/show', params).then(({ data }) => ({
		...data,
		name: data.name,
		handle: data.screen_name,
		avatar: data.profile_image_url_https,
		followers_count: data.followers_count,
	}));
};

function statusUrl(status) {
	return `https://twitter.com/${status.user.id_str}/status/${status.id_str}`;
}

// Rate limit: 1000 per user; 15000 per app
const directMessage = (recipientId, text) => {
	// claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	if (!recipientId) throw new Error('Must provide a recipient ID');
	if (!text) throw new Error('Must provide message text');

	const event = {
		type: 'message_create',
		message_create: {
			target: {
				recipient_id: recipientId,
			},
			message_data: {
				text: text,
			},
		},
	};

	return client.post('direct_messages/events/new', { event }).then(handlers.dataOnly);
};

const updateStatus = (text, _params) => {
	// claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	if (!text) {
		throw new Error('Must provide status text');
	}

	const params = {
		..._params,
		status: text,
	};

	// For each update attempt, the update text is compared with the authenticating user's recent Tweets. Any attempt that would result in duplication will be blocked, resulting in a 403 error. A user cannot submit the same status twice in a row.

	// While not rate limited by the API, a user is limited in the number of Tweets they can create at a time. If the number of updates posted by the user reaches the current allowed limit this method will return an HTTP 403 error.
	return client.post('statuses/update', params).then(handlers.dataOnly);
};

const getStatus = (id, _params) => {
	// claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;

	const params = {
		..._params,
		id,
	};
	return client.get('statuses/show', params).then(handlers.dataOnly);
};

const searchTweets = (params) => {
	// claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const searchParams = {
		q: '$woke OR $WOKE OR $WOKENS OR WOKENS',
		result_type: 'recent',
		tweet_mode: 'extended',
		count: 10,
		refresh_url: '',
		...params,
	};

	return (
		client
			// .get('tweets/search/30day/wokeproduction.json', searchParams)
			.get('search/tweets', searchParams)
			.then(({ data }) => {
				debug.d(
					`Found ${data.statuses.length || 0} tweets for query '${searchParams.q}'`
				);
				return data.statuses;
			})
	);
};

const searchClaimTweets = async (handle) => {
	// claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const searchParams = {
		//q: `@getwoketoke 0xWOKE from:${handle}`,
		q: handle ? `@getwoketoke from:${handle}` : `@getwoketoke OR 0xWOKE`,
		result_type: 'recent',
		include_entities: true,
		tweet_mode: 'extended',
		count: 100,
	};

	const { data } = await client.get('search/tweets', searchParams);
	const tweets = data.statuses.map((s) => ({
		full_text: s.full_text,
		entities: s.entities,
	}));

	if (tweets.length < 1) {
		throw new Error('No tweets found');
	}
	if (tweets.length > 1) {
		//debug.d(tweets);
	}
	//debug.d(tweets);
	return tweets;
};

// Application only authentiation
function getBearerToken(key, secret) {
	const authString = Buffer.from(encodeURI(key).concat(':', encodeURI(secret))).toString(
		'base64'
	);
	const opts = {
		url: 'https://api.twitter.com/oauth2/token/',
		headers: {
			'Authorization': 'Basic ' + authString,
			'Content-Type': 'application/x-www-form-urlencoded',
		},

		form: {
			grant_type: 'client_credentials',
		},
	};

	return request.post(opts).then((resp) => {
		resp = JSON.parse(resp);
		if (resp.access_token) {
			return resp.access_token;
		} else {
			throw new Error('Failed to retrieve bearer token');
		}
	});
}

const isConnected = () => client !== undefined && client !== null;

module.exports = {
	init,
	initClient: init, // @todo compatibility
	isConnected,
	directMessage,
	searchClaimTweets,
	getUserData,
	getUserTimeline,
	searchTweets,
	updateStatus,
};

// Example call
