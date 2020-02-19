const defaults = {
	user: 'postgres',
	pwd: 'postgres',
	db: 'db',
	host: 'localhost',
	port: 5432,
};

const vars = ['DB', 'USER', 'PWD', 'HOST', 'PORT'];

const conf = {};
vars.forEach(v => { conf[v] = process.env[`POSTGRES_${var}`]; });

// e.g. "postgresql://bot:botpass@docker_db:5432/woke_dapp"
module.exports = {
	getConnectionString: () => (`postgresql://${conf.USER}:${conf.PWD}@${conf.HOST}:${conf.PORT}/${conf.DB}`),
}
