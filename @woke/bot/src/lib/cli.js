const parseArgs = require('minimist');
const j0 = require('@woke/jack0son');
const {
	utils: { parse_bool },
} = require('@woke/lib');

const argv = parseArgs(process.argv.slice(2), {
	string: ['twitter', 'service', 'twitterApp'],
	default: {},
});

function extractCliArgs(argsToParse) {
	const conf = argsToParse.reduce((conf, [key, parser]) => {
		const opt = argv[key];
		// don't include undefined entries or they will overwrite the env conf entries
		if (opt) conf[key] = parser ? parser(opt) : opt;
		return conf;
	}, Object.create(null));
	j0.deleteEmptyKeys(conf); // sanitize to be sure
	return conf;
}

module.exports = extractCliArgs;
