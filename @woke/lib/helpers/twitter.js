const { TWITTER_ENV } = process.env;

const defaults = {
	disableMentions: false,
};

let opts = defaults;
switch (TWITTER_ENV) {
	case 'live':
		opts.disableMentions = false;
		break;
	case 'development':
		opts.disableMentions = true;
		break;
	default:
}

const PREFIX = '🤐';
const mention = (screenName) => `@${opts.disableMentions ? PREFIX : ''}${screenName}`;

function notRetweet(tweet) {
	const rt = tweet.retweeted_status;
	return rt == undefined || rt == null || rt == false;
}

module.exports = { mention, notRetweet };
