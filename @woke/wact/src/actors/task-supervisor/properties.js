const { TaskStatuses, statusList } = require('./statuses');

module.exports = () => ({
	initialState: {
		taskRepo: new Map(),
		tasksByStatus: statusList.reduce(
			(dict, status) => ({ ...dict, [status]: new Map() }),
			{}
		),
	},
});
