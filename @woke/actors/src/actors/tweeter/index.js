const { compose } = require('@woke/wact');
const Properties = require('./properties');
const actions = require('./actions');

// Must be provided with a twitter stub
const Tweeter = (twitterDomain) => compose({}, actions, Properties(twitterDomain));

module.exports = {
	Tweeter,
	actions,
	Properties,
};
