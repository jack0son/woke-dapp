const request = require('request-promise-native');
const { resources, keys } = require('../config');


function createAppAuthString(key, secret) {
	return Buffer.from(encodeURI(key).concat(':', encodeURI(secret))).toString('base64');
}

// ** oauth API calls
// Application only authentiation
export function getBearerToken(consumerKey, consumerSecret) {
	consumerKey = resources.consumer_key || consumerKey;
	consumerSecret = resources.consumer_secret || consumerSecret;
	const opts = {
		url: resources.urls.proxy_api_url + 'oauth2/token',
		headers: {
			'Authorization': 'Basic ' + createAppAuthString(consumerKey, consumerSecret),
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

export function getUserRequestToken() {
	// TODO configure in env
	const oauthParams = {
		callback: resources.callback_url,
		consumer_key: keys.consumerKey,
		consumer_secret: keys.consumerSecret,
		proxy_uri: resources.twitterApiUrl + 'oauth/request_token'
	};

	const opts = {
		url: resources.proxy_api_url + 'oauth/request_token',
		oauth: oauthParams,
	};

	console.log(opts);

	// Returns {oauth_token, oauth_token_secret, oauth_callback_confirmed}
	return request.post(opts).then(resp => {
		var resp = unmarshal(resp);
		if(resp.oauth_callback_confirmed === 'true') {
			return resp;
		} else {
			throw new Error('Failed to retrieve user request token');
		}
	});
}

export function createUserOAuthUrl(requestToken) {
		return resources.twitterApiUrl + 'oauth/authenticate?oauth_token=' + requestToken.oauth_token;
}

export async function getUserAccessToken(oAuthToken, verifierToken) {
	// TODO configure in env
	const oauthParams = {
		verifier: verifierToken,
		token: oAuthToken,
		consumer_key: keys.consumerKey,
		consumer_secret: keys.consumerSecret,
		proxy_uri: resources.twitterApiUrl + 'oauth/access_token',
	};

	const opts = {
		url: resources.proxy_api_url + 'oauth/access_token',
		oauth: oauthParams,
	};

	console.dir(opts);

	return request.post(opts).then(resp => {
		console.dir(resp);
		var resp = unmarshal(resp);
		if(resp.oauth_token && resp.oauth_token_secret) {
			return resp;
		} else {
			throw new Error('Failed to retrieve user access token');
		}
	});
}

// @params verifierPath: Unique temporary oauth token contained in callback
// response
export function catchOAuthCallback() {
	console.dir(window.location.pathname)
	console.dir("/" + resources.callback_path)
	//if(window.location.pathname == resources.callback_path) {
		if(window.location.search) {
			let callbackParams = window.location.search.substr(1);
			return unmarshal(callbackParams);
		}
	//}

	return null;
}

function unmarshal(params) {
	var obj = {};
	params.split('&').forEach( item => {
		var item = item.split('=');
		obj[item[0]] = item[1];
	});
	return obj;
}
