const useMonitor = require('./use-monitor');
const hostname = require('os').hostname();

function useNotifyOnCrash(conf) {
	if (conf && conf.onlyMe && conf.onlyMe.enabled === false) {
		return (_, __, ctx) => ctx.resume;
	}

	const monitor = useMonitor(conf);

	return (msg, error, ctx) => {
		let actorName = ctx.name;
		if (!!error.actorName) actorName = error.actorName;
		const prefixString = ` host:${hostname} Parent-${
			ctx.name
		} crash: actor<${actorName}>, action<${!!msg ? msg.type.toString() : 'none'}>`;
		console.log('notifyOnCrash: ', prefixString);
		console.log(error);
		monitor.notify(error, prefixString);
		return ctx.resume;
	};
}

module.exports = useNotifyOnCrash;
