// Replace d<module initial> converntion with d.<module> (debug.main)
const {debug, wrapInspect} = require('./common');

const i = wrapInspect(debug('t:inspect'));
const t = debug('t:test');

module.exports = {
	// Test harness
	err: debug('t:err'),// errors
	t: t,		// main
	be: debug('t:be'),		// main
	b: debug('t:b'),		// main
	c: debug('t:contract'),		// main
	i: i,
	ti: (m, obj) => {t(m), i(obj)},
	h: debug('t:helper'),		// helpers

	// Verbose
	v: debug('v:t'),		// main

	// Contracts
	to: debug('t:c:oracle'),		// main
	wt: debug('t:c:token'),		// main

	m: debug('m:m'),		// main
}

