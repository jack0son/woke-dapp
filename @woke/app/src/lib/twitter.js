const Twitter = require('twitter');
var request = require('request-promise-native');
const debug = console.log;
const config = require('../config/config').default.twitter[process.env.NODE_ENV];

require('dotenv').config();
const consumerKey = process.env.REACT_APP_TWITTER_CONSUMER_KEY;
const consumerSecret = process.env.REACT_APP_TWITTER_CONSUMER_SECRET;
const bearerToken = process.env.REACT_APP_TWITTER_BEARER_TOKEN;

var client, appOnlyClient, userClient;

const hostUrl = config.hostUrl;

const proxy_api_path = config.api.proxy_api_path || 'twitter_api';
const callback_path = config.api.callback_path || 'oauth_twitter';
const api_data_path = proxy_api_path + '/1.1';

const proxy_api_url = hostUrl + proxy_api_path + '/';
const proxy_data_url = hostUrl + api_data_path + '/';
const callback_url = hostUrl + callback_path;

function sendClientRequest(type, client, path, params) {
	return client[type](proxy_data_url + path, params);
}

const clientRequest = {
	get: (path, params) => sendClientRequest('get', client, path, params),
	post: (path, params) => sendClientRequest('get', client, path, params),
}

// ** User Auth paths
const verifyCredentials = async () => {
	const params = {
		include_entities: false,
		skip_status: true,
		include_email: false
	};

	let r = await clientRequest('account/verify_credentials', params);
	debug(r)
	if(r.length < 1) {
		throw new Error('No account found');
	}
	return r[0];
}

let authOpts = {};

const initClient = async () => {

	if(bearerToken == undefined) {
		//try {
			bearerToken = await getBearerToken(consumerKey, consumerSecret);
		//} catch(e) {
		//	console.log(e);
		//	console.log('Failed to retrieve bearer token')
		//}
		//debug(bearerToken);
	}

	authOpts = {
		consumer_key: consumerKey, 
		consumer_secret: consumerSecret,
		bearer_token: bearerToken, 
		//access_token_key: null,
		//access_token_secret: null,
	}

	appOnlyClient = new Twitter({
		consumer_key: consumerKey, 
		consumer_secret: consumerSecret,
		bearer_token: bearerToken, 
	});

	client = appOnlyClient;

	return;
}

const getUserData = async (userId, handle) => {
	const params = handle ? {screen_name: handle} : {user_id: userId};

	let userObject = await clientRequest.get('users/show.json', params);

	let avatarSmall = userObject.profile_image_url_https;

	return {
		id: userObject.id_str,
		name: userObject.name,
		handle: userObject.screen_name,
		avatar: userObject.profile_image_url_https,
	}
}

const initUserClient = async (access_token, access_token_secret) => {

	userClient = new Twitter({
		consumer_key: consumerKey, 
		consumer_secret: consumerSecret,
		access_token_key: access_token,
		access_token_secret: access_token_secret,
	});

	client = appClient;

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

	let r = await clientRequest.get('statuses/user_timeline.json', params);

	if(r.length < 1) {
		throw new Error('No tweets found');
	}

	return r;
}

export const getUserFriendsList = async (userId, count) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const countPerPage = 200;

	const params = {
		cursor: -1,
		user_id: userId,
		trim_user: false,
		//tweet_mode: 'extended',
		skip_status: true,
		inlcude_user_entities: false,
		count: countPerPage,
	};

	let r = [];
	let pages = Math.ceil(count / countPerPage) // fail safe to avoid rate limit
	while(params.cursor != 0 && pages > 0) {
		if(r.length < count) {
			let resp = await clientRequest.get('friends/list.json', params);
			if(resp.users) {
				r = [...r, ...resp.users];
			}
			params.cursor = resp.next_cursor;
			pages -= 1;
		}
	}

	if(r.length < 1) {
	}

	return r;
}

function isClaimTweet(tweet) {
	const CLAIM_FRAME = '0xWOKE:';
	return tweet.full_text && tweet.full_text.includes(CLAIM_FRAME);
}

// TODO replace claimFrame with regex
// @param claimFrame: Text common to each claim string
const findClaimTweet = async (userId) => {
	let latestTweets = await getUserTimeline(userId);
	let latest = latestTweets[0];
	if(isClaimTweet(latest)) {
		return latest.full_text;
	} else {
		for(let tweet of latestTweets.slice(1, latestTweets.length)) {
			if(isClaimTweet(tweet)) {
				return tweet.full_text;
			}
		}
	}

	throw new Error('Could not find claim tweet');
}


const searchClaimTweet = async (handle) => { // claimString = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	const searchParams = {
		//q: `@getwoketoke 0xWOKE from:${handle}`,
		q: `@getwoketoke from:${handle}`,
		result_type: 'recent',
		tweet_mode: 'extended',
		count: 1,
	};

	let r = await clientRequest.get('search/tweets', searchParams);
	//blog(r);
	let tweets = r.statuses.map(s => s.full_text);
	if(tweets.length < 1) {
		throw new Error('No tweets found');
	}
	if(tweets.length > 1) {
		// Should never get here
		console.dir(tweets);
	}
	return tweets[0];
}

const getUserAccessToken = async (oAuthToken, verifierToken) => {
	// TODO configure in env
	const oauthParams = {
		verifier: verifierToken,
		token: oAuthToken,
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		proxy_uri: 'https://api.twitter.com/oauth/access_token'
	};

	const opts = {
		url: proxy_api_url + 'oauth/access_token',
		oauth: oauthParams,
	};

	return request.post(opts).then(resp => {
		console.dir(resp);
		var resp = deparam(resp);
		if(resp.oauth_token && resp.oauth_token_secret) {
			return resp;
		} else {
			throw new Error('Failed to retrieve user access token');
		}
	});
}

const getUserOAuthToken = async () => {
	// TODO configure in env
	const oauthParams = {
		callback: callback_url,
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		proxy_uri: 'https://api.twitter.com/oauth/request_token'
	};

	const opts = {
		url: proxy_api_url + 'oauth/request_token',
		oauth: oauthParams,
	};

	console.log(opts);

	return request.post(opts).then(resp => {
		var resp = deparam(resp);
		if(resp.oauth_callback_confirmed === 'true') {
			return resp;
		} else {
			throw new Error('Failed to retrieve user request token');
		}
	});
}

// Application only authentiation
function getBearerToken(key, secret) {
	const authString = Buffer.from(encodeURI(key).concat(':', encodeURI(secret))).toString('base64');
	const opts = {
		url: proxy_api_url + 'oauth2/token',
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

function deparam(params) {
	var obj = {};
	params.split('&').forEach( item => {
		var item = item.split('=');
		obj[item[0]] = item[1];
	});
	return obj;
}

export const appClient = {initClient, findClaimTweet};

export default {getUserFriendsList, findClaimTweet, initClient, getUserOAuthToken, getUserAccessToken, getUserData, deparam}


/*
Twitter lib checks if using app-only like this

// Check to see if we are going to use User Authentication or Application Authetication
	if (this.options.bearer_token) {
		authentication_options = {
			headers: {
				Authorization: 'Bearer ' + this.options.bearer_token
			}
		};
	}
	*/
