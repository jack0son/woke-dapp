const Actions = require('./actions');
const Properties = require('./properties');
const Definition = require('../../definition').MakeDefinition(Actions, Properties);

module.exports = {
	Actions,
	Properties,
	Definition,
	Statuses: require('./statuses'),
	errors: require('./errors'),
};
