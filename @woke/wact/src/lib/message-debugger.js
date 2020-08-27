const { Logger } = require('@woke/lib');

const DEBUG_PREFIX = 'actor';

/**
 * Instantiate debugger functions with access to message context
 *
 *
 * @param {string} _name - Actor name
 * @param {string} [_debugPrefix] - Debugging prefix string
 * @return {Logger}
 */
function MessageDebugger(_name, _debugPrefix = DEBUG_PREFIX) {
	const debug = {};
	Object.entries(Logger(`${_debugPrefix}:${_name}`)).forEach(([key, val]) => {
		if (key == 'control' || key == 'log') {
			debug[key] = val;
		} else {
			// Msg must be passed to debug call. Otherwise the debugger would have
			// to be re-bound to the current msg context for each message.
			debug[key] = (msg, args) =>
				val(`${msg.type ? msg.type.toString() : 'void'} >> ` + args);
		}
	});
	return debug;
}

module.exports = MessageDebugger;
