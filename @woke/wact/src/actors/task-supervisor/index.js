const Actions = require('./actions');
const Properties = require('./properties');
const Definition = require('../../definition').MakeDefinition(Actions, Properties);

console.dir(Definition);

module.exports = {
	Actions,
	Properties,
	Definition,
	Statuses: require('./statuses'),
	errors: require('./errors'),
};
