const { serviceConf } = require('@woke/service');
const web3Config = require('@woke/web3-nact').config;
const TipSystem = require('../systems/tip-system');

serviceConf.networkList = web3Config.networkList;
console.log('config', serviceConf);

// @TODO parse polling interval
const bootstrap = async () => {
	const tipSystem = new TipSystem({
		pollingInterval: 5 * 1000,
		...serviceConf,
	});
	return tipSystem.start();
};

bootstrap().catch(console.log);
