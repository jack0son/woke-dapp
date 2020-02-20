const defaults = {
	USER: 'woke_bot',
	PWD: 'woke_bot',
	DB: 'bot_db',
	HOST: 'localhost',
	PORT: 5433,
};

const conf = {};
Object.keys(defaults).forEach(v => conf[v] = process.env[`POSTGRES_${v}`] || defaults[v]);

// e.g. "postgresql://bot:botpass@docker_db:5432/woke_dapp"
module.exports = {
	getConnectionString: () => (`postgresql://${conf.USER}:${conf.PWD}@${conf.HOST}:${conf.PORT}/${conf.DB}`),
}
