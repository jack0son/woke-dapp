const Actions = require('./actions');
const Properties = require('./properties');
const Definition = require('../../definition').MakeDefinition(Actions, Properties);
const Statuses = require('./statuses');

module.exports = {
	Actions,
	Properties,
	Definition,
	Statuses: Statuses,
	TaskStatuses: Statuses.TaskStatuses,
	errors: require('./errors'),
};
