require('dotenv').config();
const config = require('../../config/config').default.twitter[process.env.NODE_ENV];

const consumerKey = process.env.REACT_APP_TWITTER_CONSUMER_KEY;
const consumerSecret = process.env.REACT_APP_TWITTER_CONSUMER_SECRET;
const bearerToken = process.env.REACT_APP_TWITTER_BEARER_TOKEN;

const hostUrl = config.hostUrl;
const twitterApiUrl = 'https://api.twitter.com/';

const proxy_api_path = config.api.proxy_api_path || 'twitter_api';
const callback_path = config.api.callback_path || 'oauth_twitter';
const api_data_path = proxy_api_path + '/1.1';

const proxy_api_url = hostUrl + proxy_api_path + '/';
const proxy_data_url = hostUrl + api_data_path + '/';
const callback_url = hostUrl + callback_path;

const resources = {
		proxy_api_path,
		callback_path,
		api_data_path,

		hostUrl,
		twitterApiUrl,

		proxy_api_url,
		proxy_data_url,
		callback_url,
};

const keys = {
	consumerKey,
	consumerSecret,
	bearerToken,
}

module.exports = {
	resources,
	keys,
};
