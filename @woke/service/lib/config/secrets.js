const secrets = require('@woke/secrets');

const loadSecrets = (_list, conf = {}) => {
	const dict = {
		twitter: ['twitter', conf.twitterApp || 'staging-bot'],
		ethereum: ['ethereum', conf.ethEnv || 'development'],
		infura: ['infura'],
	};
	const all = Object.keys(dict);
	const list = _list || all;
	list.forEach((key) => secrets(...dict[key]));
};

module.exports = loadSecrets;
