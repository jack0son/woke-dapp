const parseArgs = require('minimist');

const argv = parseArgs(process.argv.slice(2), {
	//boolean: ['verbose', 'v', 'persist'],
	string: ['twitter', 'service'],
	default: {},
});
console.log(argv);
const { verbose, v, persist, twitter, debugRecovery, muffled, _, ...args } = argv;

module.exports = {
	verbose: args.v || args.verbose,
	persist,
	twitter,
	debugRecovery,
	muffled,
};
