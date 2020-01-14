// Replace d<module initial> converntion with d.<module> (debug.main)
const {debug, wrapInspect} = require('./common');

module.exports = {
	// Test harness
	err: debug('t:err'),// errors
	t: debug('t:test'),		// main
	be: debug('t:be'),		// main
	b: debug('t:b'),		// main
	c: debug('t:contract'),		// main
	i: wrapInspect(debug('t:inspect')),
	h: debug('t:helper'),		// helpers

	// Verbose
	v: debug('v:t'),		// main

	// Contracts
	to: debug('t:c:oracle'),		// main
	wt: debug('t:c:token'),		// main

	m: debug('m:m'),		// main
}

