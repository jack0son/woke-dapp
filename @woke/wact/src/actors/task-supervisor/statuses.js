const TaskStatuses = {
	init: Symbol('init'),
	ready: Symbol('ready'),
	pending: Symbol('pending'),
	failed: Symbol('failed'),
	abort: Symbol('abort'),
	done: Symbol('done'),
};

const statusList = Object.values(TaskStatuses);

const isStatus = (status) => statusList.includes(status);

module.exports = { TaskStatuses, isStatus, statusList };
