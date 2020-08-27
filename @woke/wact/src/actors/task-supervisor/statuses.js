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
const parseStatus = (status) =>
	typeof status === 'string' ? Statuses[status] : isStatus(status) ? status : null;

module.exports = { TaskStatuses, statusList, isStatus, parseStatus };
