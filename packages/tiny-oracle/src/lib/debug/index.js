// Replace d<module initial> converntion with d.<module> (debug.main)
const {debug, wrapInspect} = require('./common');

const i = wrapInspect(debug('m:inspect'));
const t = debug('m:test');
const e = debug('e:event');

module.exports = {
	// Test harness
	err: debug('m:err'),// errors
	i: i,
	ei: (m, obj) => {e(m), i(obj)},
	h: debug('m:handler'),		// helpers
	m:debug('m:main'),
	e: e,
	name: (name, m) => debug(`m:${name}`)(m),
	t: debug('m:test'),

	// Verbose
	v: debug('v:m'),		

	// Contracts
	to: debug('m:c:oracle'),		
	wm: debug('m:c:token'),		

	debug: debug
}

