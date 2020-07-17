const MonitorSystem = require('./monitor-twitter');
const { ActorSystem: { dispatch } } = require('@woke/wact');

var Monitor = function (opts) {
	if (Monitor._instance) return Monitor._instance;

	// Only disable if asked explicitly 
	const { enabled, ...systemOpts } = opts;
	this.system = enabled === false ? null : MonitorSystem(systemOpts); 
	Monitor._instance = this;
};

Monitor.getInstance = function (opts) {
    return Monitor._instance || new Monitor(opts);
}

const doNothing = () => {};
const notify = (monitorSystem) => (error, prefixString) => {
	const { a_monitor } = monitorSystem;
	dispatch(a_monitor, { type: 'notify', error, prefixString });
}

// TODO add missing config defaults
const defaults = { enabled: true };
function useMonitor(_conf) {
	const conf = { ...defaults, ..._conf };
	const monitor = Monitor.getInstance(conf);

	return {
		notify: monitor.system !== null ? notify(monitor.system) : doNothing,
	};
}

module.exports = useMonitor;

