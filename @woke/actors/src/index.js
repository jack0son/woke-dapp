const tweeter = require('./actors/tweeter');
const MonitorSystem = require('./systems/monitor-twitter');
const useMonitor = require('./hooks/use-monitor');
const useMonitor = require('./hooks/use-oncrash-notify');

module.exports = {
	MonitorSystem,
	useMonitor,
	useNotifyOnCrash,
	tweeter,
};
