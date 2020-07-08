const defaults = {
	USER: 'woke_bot',
	PWD: 'woke_bot',
	DB: 'bot_db',
	HOST: 'localhost',
	PORT: 5433,
};

const conf = {};
// Use environment parameters if defined
Object.keys(defaults).forEach(v => conf[v] = process.env[`POSTGRES_${v}`] || defaults[v]);

function getConnectionString(_conf) {
	_conf = _conf || conf;
	return `postgresql://${_conf.USER}:${_conf.PWD}@${_conf.HOST}:${_conf.PORT}/${_conf.DB}`
}

// e.g. "postgresql://bot:botpass@docker_db:5432/woke_dapp"
module.exports = {
	getConnectionString,
}
