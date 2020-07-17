const tweeter = require('./actors/tweeter');
const MonitorSystem = require('./systems/monitor-twitter');
const useMonitor = require('./hooks/use-monitor');

module.exports = {
	MonitorSystem,
	useMonitor,
	tweeter,
};
