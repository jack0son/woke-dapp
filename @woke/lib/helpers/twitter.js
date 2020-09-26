const { TWITTER_ENV, TWITTER_MENTIONS } = process.env;
const { parseBool } = require('../utils');

const defaults = {
	disableMentions: false,
};

// @TODO decide on a conf ffs
let opts = defaults;
switch (TWITTER_ENV) {
	case 'production':
	case 'live':
		opts.disableMentions = false;
		break;
	case 'muffled':
	case 'development':
		opts.disableMentions = true;
		break;
	default:
}

if (TWITTER_MENTIONS) opts.disableMentions = parseBool(TWITTER_MENTIONS);

const PREFIX = '🤐';
const mention = (screenName) => `@${opts.disableMentions ? PREFIX : ''}${screenName}`;

function notRetweet(tweet) {
	const rt = tweet.retweeted_status;
	return rt == undefined || rt == null || rt == false;
}

module.exports = { mention, notRetweet };
