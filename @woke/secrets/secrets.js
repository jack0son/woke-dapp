const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const defaultOptions = {
	secretsPath: 'secrets',
	prefix: 'secrets',
	postfix: 'secrets',
};

const configure = (opts, defaults) => ({ ...defaults, ...opts });

let conf;
let store = Object.create(null);

function getSecretPath([...args]) {
	const fname = args.join('.'); // secrets env file
	return path.resolve(conf.secretsPath, fname);
}

function secrets(...args) {
	if (!args || !args[0]) throw new Error('Must provide a secret namespace');
	const namespace = args[0];
	const path = getSecretPath(args);
	if (!fs.existsSync(path)) throw new Error(`Secrets file at ${path} does not exist`);
	store[namespace] = dotenv.config({ path }).parsed;
	return store[namespace];
}

secrets.config = (opts) => {
	conf = configure(opts, defaultOptions);
};

secrets.get = () => ({ ...store });
secrets.config();

module.exports = secrets;
