const MonitorSystem = require('../systems/monitor-twitter');
const { configure } = require('@woke/lib');
const {
	ActorSystem: { dispatch },
} = require('@woke/wact');

const masterSwitch = process.env.FAULT_MONITORING_MASTER_SWITCH;

// Monitoring singleton
const Monitor = function (opts) {
	if (Monitor._instance) return Monitor._instance;

	// Only disable if specified explicitly
	const { enabled, ...systemOpts } = opts;
	this.system = enabled === false ? null : MonitorSystem(systemOpts);
	Monitor._instance = this;
};

// First caller to get instance decides whether monitoring is enabled
Monitor.getInstance = function (opts) {
	return Monitor._instance || new Monitor(opts);
};

const notify = (monitorSystem) => (error, prefixString) => {
	dispatch(monitorSystem.a_monitor, { type: 'notify', error, prefixString });
};

const doNothing = () => {};

// TODO add missing config defaults
const defaults = { enabled: false };
function useMonitor(_conf) {
	const conf = configure(_conf, defaults);
	// console.trace(conf);
	const monitor = Monitor.getInstance(conf);
	// console.log({ monitor });

	return {
		notify: monitor.system === null ? doNothing : notify(monitor.system),
	};
}

module.exports = useMonitor;
