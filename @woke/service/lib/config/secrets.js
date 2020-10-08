const secrets = require('@woke/secrets');

const all = Object.keys(dict);

const loadSecrets = (_list, conf = {}) => {
	const dict = {
		twitter: ['twitter', conf.twitterApp || 'oracle-bot'],
		ethereum: ['ethereum', conf.ethEnv || 'ganache'],
		infura: ['infura'],
	};
	const list = _list || all;
	list.forEach((key) => secrets(...dict[key]));
};

module.exports = loadSecrets;
