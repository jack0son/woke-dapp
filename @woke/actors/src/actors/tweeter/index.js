const { compose } = require('@woke/wact');
const Properties = require('./properties');
const actions = require('./actions');

// Must be provided with a twitter stub
const Tweeter = (twitterStub) => compose({}, actions, Properties(twitterStub));

module.exports = {
	Tweeter,
	actions,
	Properties,
};
