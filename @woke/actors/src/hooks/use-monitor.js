const MonitorSystem = require('../systems/monitor-twitter');
const {
	ActorSystem: { dispatch },
} = require('@woke/wact');

// Monitoring singleton
const Monitor = function(opts) {
	if (Monitor._instance) return Monitor._instance;

	// Only disable if specified explicitly
	const { enabled, ...systemOpts } = opts;
	this.system = enabled === false ? null : MonitorSystem(systemOpts);
	Monitor._instance = this;
};

Monitor.getInstance = function(opts) {
	return Monitor._instance || new Monitor(opts);
};

const notify = (monitorSystem) => (error, prefixString) => {
	const { a_monitor } = monitorSystem;
	dispatch(a_monitor, { type: 'notify', error, prefixString });
};

const doNothing = () => {};

// TODO add missing config defaults
const defaults = { enabled: true };
function useMonitor(_conf) {
	const conf = { ...defaults, ..._conf };
	const monitor = Monitor.getInstance(conf);

	return {
		notify:
			monitor.system === null || !conf.enabled
				? doNothing
				: notify(monitor.system),
	};
}

module.exports = useMonitor;
