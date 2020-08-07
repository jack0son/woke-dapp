// Persistence repository configuration

const defaults = {
	USER: 'woke_bot',
	PWD: 'woke_bot',
	DB: 'bot_db',
	HOST: 'localhost',
	PORT: 5433,
};

const defaultConf = {};
// Use environment parameters if defined
Object.keys(defaults).forEach(
	(v) => (defaultConf[v] = process.env[`POSTGRES_${v}`] || defaults[v])
);

// e.g. "postgresql://bot:botpass@docker_db:5432/woke_dapp"
function getConnectionString(_conf) {
	const conf = { ...defaultConf, ..._conf };
	return `postgresql://${conf.USER}:${conf.PWD}@${conf.HOST}:${conf.PORT}/${conf.DB}`;
}

module.exports = {
	getConnectionString,
};
