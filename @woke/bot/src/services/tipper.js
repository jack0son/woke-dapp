const secrets = require('@woke/secrets');
secrets('ethereum', process.env.ETH_ENV || process.env.NODE_ENV);

const { loadSecrets, serviceConf } = require('@woke/service');
const TipSystem = require('../systems/tip-system');
loadSecrets(['infura', 'ethereum', 'twitter'], serviceConf);

// @TODO parse polling interval
const bootstrap = () => {
	const tipSystem = new TipSystem(serviceConf);
	return tipSystem.start();
};

bootstrap().catch(console.log);
