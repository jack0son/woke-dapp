const TaskStatuses = {
	init: Symbol('init'),
	ready: Symbol('ready'),
	pending: Symbol('pending'),
	failed: Symbol('failed'),
	abort: Symbol('abort'),
	done: Symbol('done'),
};

module.exports = TaskStatuses;
