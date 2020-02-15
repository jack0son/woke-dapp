const debug = require('debug');
const { inspect } = require('util');

const wrapInspect = (wrapper) => ((obj, d=null) => wrapper(inspect(obj, {depth: d})));

const Logger = (prefix = 'm') => {
	const t = debug(`${prefix}:test`);
	const e = debug(`${prefix}:event`);
	// Replace d<module initial> convention with d.<module> (e.g. debug.main)

	return {
		d: debug(`${prefix}`),
		inspect: wrapInspect(debug(`${prefix}:obj`)),
		error: debug(`${prefix}:err`),// errors
		ei: (m, obj) => {e(m), i(obj)}, // error with inspect object
		h: debug(`${prefix}:handler`),		// helpers
		info: debug(`${prefix}:info`),		// helpers
		m: debug(`${prefix}:main`),
		e: e,
		name: (name, msg) => debug(`${prefix}:${name}`)(msg),
		t: t,

		// Verbose
		v: debug(`v:${prefix}`),		

		debug: debug
	}
}

module.exports = Logger

