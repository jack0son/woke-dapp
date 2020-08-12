const { TaskStatuses } = require('./statuses');

module.exports = {
	initialState: {
		taskRepo: new Map(),
		tasksByStatus: Object.values(TaskStatuses).reduce(
			(lut, status) => ({ ...lut, [status]: new Map() }),
			{}
		),
	},
};
