const parseArgs = require('minimist');
const j0 = require('@woke/jack0son');
const {
	utils: { parse_bool },
} = require('@woke/lib');

const argv = parseArgs(process.argv.slice(2), {
	string: ['twitter', 'service', 'twitterApp'],
	default: {},
});
const {
	twitterApp,
	verbose,
	v,
	persist,
	twitter,
	debugRecovery,
	muffled,
	_,
	...args
} = argv;

const conf = {
	verbose: parse_bool(verbose),
	persist: parse_bool(persist),
	twitter,
	debugRecovery,
	muffled,
	twitterApp,
};

j0.deleteEmptyKeys(conf);

module.exports = conf;
