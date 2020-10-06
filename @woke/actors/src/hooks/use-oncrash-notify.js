const useMonitor = require('./use-monitor');

function useNotifyOnCrash(conf) {
	const monitor = useMonitor(conf);

	return (msg, error, ctx) => {
		let actorName = ctx.name;
		if (!!error.actorName) actorName = error.actorName;
		const prefixString = `Parent-${ctx.name} crash: actor<${actorName}>, action<${
			!!msg ? msg.type.toString() : 'none'
		}>`;
		console.log('notifyOnCrash: ', prefixString);
		console.log(error);
		monitor.notify(error, prefixString);
		return ctx.resume;
	};
}

module.exports = useNotifyOnCrash;
