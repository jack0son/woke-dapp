const environments = ['production', 'development', 'staging'];
const env = process.env.ETH_ENV || process.env.NODE_ENV;
const decision = environments.includes(env) ? env : 'development';

const artifacts = require('@woke/contracts')[decision];

function loadArtifactByName(name) {
	const a = artifacts[name];
	if (!a) {
		throw new Error(`Could not find artifact for '${name}' contract`);
	}
	return a;
}

module.exports = { loadArtifactByName };
