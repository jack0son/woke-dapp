// Persistence repository configuration

const defaults = {
	USER: 'woke_bot',
	PWD: 'woke_bot',
	DB: 'bot_db',
	HOST: 'localhost',
	PORT: 5433,
};

const conf = {};
// Use environment parameters if defined
Object.keys(defaults).forEach(
	(v) => (conf[v] = process.env[`POSTGRES_${v}`] || defaults[v])
);

// e.g. "postgresql://bot:botpass@docker_db:5432/woke_dapp"
function getConnectionString(_conf) {
	const cf = { ...conf, ..._conf };
	return `postgresql://${_conf.USER}:${_conf.PWD}@${_conf.HOST}:${_conf.PORT}/${_conf.DB}`;
}

module.exports = {
	getConnectionString,
};
