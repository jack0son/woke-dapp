const debug = require('debug');
const { inspect } = require('util');

const wrapInspect = (wrapper) => ((obj, d=null) => wrapper(inspect(obj, {depth: d})));

const Logger = (prefix = 'm') => {
	// Replace d<module initial> convention with d.<module> (e.g. debug.main)
	const d = debug(`${prefix}`);
	const t = d.extend(`test`);
	const e = d.extend(`event`);

	const levels = {
		d: d,
		log: d.extend(`*`), // ignore enabled / disabled
		inspect: wrapInspect(d.extend(`obj`)),
		error: d.extend(`err`),// errors
		warn: d.extend(`warn`),// errors
		ei: (m, obj) => {e(m), i(obj)}, // error with inspect object
		h: d.extend(`handler`),		// helpers
		info: d.extend(`info`),		// helpers
		m: d.extend(`main`),
		e: e,
		name: (name, msg) => d.extend(`${name}`)(msg),
		t: t,

		// Verbose
		v: debug(`v:${prefix}`),		
	}


	const disable = () => {
		levels.info(`DEBUG: disabling...`);
		Object.values(levels).forEach(d => d.enabled = false);
	}

	const enable = () => {
		Object.values(levels).forEach(d => d.enabled = true);
		levels.info(`DEBUG: enabled '${prefix}'`);
	}
	//console.log(debug);
	//console.log(d);

	return {
		control: {
			disable,
			enable,
			enabled: () => (d.enabled),
			debug,
		},
		...levels,
	}
}

module.exports = Logger

