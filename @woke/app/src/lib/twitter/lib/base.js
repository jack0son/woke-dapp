import Twitter from 'twitter';
import {
	isValidConsumerKey,
	isValidConsumerSecret,
	isValidBearerToken,
} from './helpers';
import { TokenError } from './errors';
const {resources} = require('../config');

// ** Support proxying of requests
function makeBaseClient({
	consumerKey,
	consumerSecret,
	bearerToken,
	accessTokenKey,
	accessTokenSecret,
}) {
	checkToken(isValidConsumerKey, consumerKey, 'consumer_key');
	checkToken(isValidConsumerSecret, consumerKey, 'consumer_secret');
	checkToken(isValidBearerToken, bearerToken, 'bearer');

	const client = new Twitter({
		consumer_key: consumerKey, 
		consumer_secret: consumerSecret,
		access_token_key: accessTokenKey,
		access_token_secret: accessTokenSecret,
	});

	const request = {
		get: (path, params) => sendClientRequest('get', client, path, params),
		post: (path, params) => sendClientRequest('post', client, path, params),
	}

	return {
		request,
	}
}

function sendClientRequest(type, client, path, params) {
	return client[type](resources.proxy_data_url + path, params);
}

function checkToken(isValidToken, token, label) {
	if(!(token.length &&  token.length > 0)) {
		throw new TokenError(`${label} token not supplied`);
	}
}
