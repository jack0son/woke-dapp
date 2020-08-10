const Statuses = require('./statuses');

const properties = {
	initialState: {
		taskRepo: new Map(),
		tasksByStatus: Object.values(Statuses).reduce(
			(lut, status) => ({ ...lut, [status]: new Map() }),
			{}
		),
	},
};
