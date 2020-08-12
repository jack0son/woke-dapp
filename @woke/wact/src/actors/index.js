module.exports = {
	...require('./adapters'),
	Polling: require('./polling'),
	TaskSupervisor: require('./task'),
};
