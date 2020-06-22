const artifacts = require('@woke/contracts')[process.env.NODE_ENV !== 'production' ? 'development' : 'production'];

function load(name) {
	const a = artifacts[name];
	if(!a) {
		throw new Error(`Could not find artifact for '${name}' contract`);
	}
	return a;
}

const delay = async (ms) => new Promise(res => setTimeout(res, ms)); 

module.exports = { delay };
