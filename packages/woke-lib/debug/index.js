// Replace d<module initial> convention with d.<module> (e.g. debug.main)
const {debug, wrapInspect} = require('./common');

const Debugger = (prefix = 'm') => {
	const i = wrapInspect(debug(`${prefix}:obj`)); // inspect object
	const t = debug(`${prefix}:test`);
	const e = debug(`${prefix}:event`);

	return {
		d: debug(`${prefix}`),
		error: debug(`${prefix}:err`),// errors
		i: i,
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

module.exports = Debugger

