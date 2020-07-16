const makeProperties = require('./properties');
const actions = require('./actions');

// Must be provided with a twitter stub
const Tweeter = (opts) => ({
	properties: MakeProperties(opts),
	actions,
})

module.exports = {
	Tweeter,
	actions,
	Properties: makeProperties,
}
