const { TaskStatuses, statusList, encoder, decoder } = require('./statuses');

module.exports = () => ({
	initialState: {
		taskRepo: new Map(),
		tasksByStatus: statusList.reduce(
			(dict, status) => ({ ...dict, [status]: new Map() }),
			{}
		),
	},
	encoder,
	decoder,
});
