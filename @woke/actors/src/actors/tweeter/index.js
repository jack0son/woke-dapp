const MakeProperties = require('./properties');
const actions = require('./actions');

module.exports = (opts) => ({
	properties: MakeProperties(opts),
	actions,
})
