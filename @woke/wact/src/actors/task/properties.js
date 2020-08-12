const { TaskStatuses, statusList } = require('./statuses');

module.exports = () => ({
	initialState: {
		taskRepo: new Map(),
		tasksByStatus: statusList.reduce(
			(lut, status) => ({ ...lut, [status]: new Map() }),
			{}
		),
	},
});
