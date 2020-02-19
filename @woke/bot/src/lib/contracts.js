const artifacts = require('@woke/contracts')[process.env.NODE_ENV !== 'development' ? 'production' : 'development'];

function load(name) {
	const a = artifacts[name];
	if(!a) {
		throw new Error(`Could not find artifact for '${name}' contract`);
	}
	return a;
}

module.exports =  { load };
