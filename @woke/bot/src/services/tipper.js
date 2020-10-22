const { loadSecrets, serviceConf } = require('@woke/service');
const TipSystem = require('../systems/tip-system');
loadSecrets(['infura', 'ethereum', 'twitter'], serviceConf);

// @TODO parse polling interval
const bootstrap = () => {
	const tipSystem = new TipSystem({
		pollingInterval: 5 * 1000,
		...serviceConf,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
