const path = require('path');

module.exports.resolveEnvFilePath = () => {
	// development.local.env		local development
	// development.remote.env		local development
	// staging.local.env				local staging
	// staging.remote.env				remote staging
	// .env											production
	// local.env								local production

	const env = process.env.NODE_ENV;
	const location = process.env.LOCATION_ENV;
	let envTag = env,
		locTag = location;

	if (env == 'production') {
		location && location !== 'remote' && (locTag = location);
		envTag = '';
	} else {
		if (!locTag) locTag = 'local';
	}

	return path.resolve(
		`${envTag && envTag + '.'}${locTag && locTag + '.'}${envTag || locTag ? '' : '.'}env`
	);
};

module.exports.parse_bool = (str) => {
	switch (str) {
		case 't':
		case 'T':
		case 'true':
			return true;
		case 'f':
		case 'F':
		case 'false':
		default:
			return false;
	}
};

module.exports.delay = async (ms) => new Promise((res) => setTimeout(res, ms));
