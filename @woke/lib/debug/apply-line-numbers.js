const DEFAULT_LINE_NUMBER_LEVELS = ['warn', 'error'];

const defaultOpts = { callDepth: 1, prepend: false };
const applyLineNumberToLevels = (levelMethods) => (
	levels = DEFAULT_LINE_NUMBER_LEVELS,
	opts
) => {
	const conf = { ...defaultOpts, ...opts };

	// https://regex101.com/r/vQ2oOO/2/
	const format = conf.prepend
		? (args, initiator) => {
				const abridged = initiator.match(
					/[0-9a-zA-Z ... -]+\/[0-9a-zA-Z ... -]+:\d+:\d+/
				);
				return [abridged ? abridged[0] : 'BAD_REGEX' + initiator, ...args];
		  }
		: (args, initiator) => [...args, '\n', `  at ${initiator}`];

	// if(conf.prepend) {
	// 	initiator.match(/\w+\/\w+.\w+:\d+:\d+/);
	// }

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
							if (stackCount == conf.callDepth) {
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
			originalMethod.apply(levelMethods, format(args, initiator));
		};
	});
};

module.exports = applyLineNumberToLevels;
