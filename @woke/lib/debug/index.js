const debug = require('debug');
const { inspect } = require('util');
const configure = require('../configure');

const wrapInspect = (wrapper) => (obj, d = null) => wrapper(inspect(obj, { depth: d }));

const DEFAULT_LINE_NUMBER_LEVELS = ['warn', 'error'];
const applyLineNumberToLevels = (levelMethods) => (
	levels = DEFAULT_LINE_NUMBER_LEVELS,
	callDepth = 1
) => {
	levels.forEach((methodName) => {
		const originalMethod = levelMethods[methodName];
		levelMethods[methodName] = (...args) => {
			let initiator = 'unknown place';
			try {
				throw new Error();
			} catch (e) {
				if (typeof e.stack === 'string') {
					let stackCount = 0;
					for (const line of e.stack.split('\n')) {
						const matches = line.match(/^\s+at\s+(.*)/);
						if (matches) {
							if (stackCount == callDepth) {
								// first line - current function
								// second line - caller (what we are looking for)
								initiator = matches[1];
								break;
							}
							stackCount++;
						}
					}
				}
			}
			originalMethod.apply(levelMethods, [...args, '\n', `  at ${initiator}`]);
		};
	});
};

const Logger = (prefix = 'm', _opts) => {
	const opts = configure(_opts, {
		lineNumbers: { enabled: true, levels: DEFAULT_LINE_NUMBER_LEVELS, callDepth: 1 },
	});

	// Replace d<module initial> convention with d.<module> (e.g. debug.main)
	const d = debug(`${prefix}`);
	const t = d.extend(`test`);
	const e = d.extend(`event`);

	const levels = {
		d: d,
		log: d.extend(`*`), // ignore enabled / disabled
		inspect: wrapInspect(d.extend(`obj`)),
		error: d.extend(`err`), // errors
		warn: d.extend(`warn`), // errors
		ei: (m, obj) => {
			e(m), i(obj);
		}, // error with inspect object
		h: d.extend(`handler`), // helpers
		info: d.extend(`info`), // helpers
		m: d.extend(`main`),
		e: e,
		name: (name, msg) => d.extend(`${name}`)(msg),
		t: t,

		// Verbose
		v: debug(`v:${prefix}`),
	};

	const disable = () => {
		levels.info(`DEBUG: disabling...`);
		Object.values(levels).forEach((d) => (d.enabled = false));
	};

	const enable = () => {
		Object.values(levels).forEach((d) => (d.enabled = true));
		levels.info(`DEBUG: enabled '${prefix}'`);
	};

	if (opts.lineNumbers && opts.lineNumbers.enabled)
		applyLineNumberToLevels(levels)(opts.lineNumbers.levels, opts.lineNumbers.callDepth);

	return {
		control: {
			enableLineNumbers: applyLineNumberToLevels(levels),
			disable,
			enable,
			enabled: () => d.enabled,
			debug,
		},
		...levels,
	};
};

module.exports = Logger;
