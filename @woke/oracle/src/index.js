const { configure } = require('@woke/lib');
const { loadSecrets, serviceConf } = require('@woke/service');
const OracleSystem = require('./oracle-system');
const opts = require('./config');

const conf = configure(opts, serviceConf);

loadSecrets(['infura', 'ethereum'], conf);

// @TODO parse polling interval
const bootstrap = () => {
	const oracleSystem = new OracleSystem(conf);
	return oracleSystem.start();
};

bootstrap().catch(console.log);
