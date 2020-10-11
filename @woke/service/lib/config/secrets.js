const secrets = require('@woke/secrets');

const loadSecrets = (_list, conf = {}) => {
	console.log(conf);
	const dict = {
		twitter: ['twitter', conf.twitterApp || 'oracle-bot'],
		ethereum: ['ethereum', conf.ethEnv || 'ganache'],
		infura: ['infura'],
	};
	const all = Object.keys(dict);
	const list = _list || all;
	list.forEach((key) => secrets(...dict[key]));
};

module.exports = loadSecrets;
