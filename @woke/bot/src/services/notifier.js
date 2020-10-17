const { serviceConf } = require('@woke/service');
const web3Config = require('@woke/web3-nact').config;
const NotificationSystem = require('../systems/notification-system');

serviceConf.networkList = web3Config.networkList;
console.log('config', serviceConf);

const bootstrap = async () => {
	const notiSystem = new NotificationSystem(serviceConf);
	return notiSystem.start();
};

bootstrap().catch(console.log);
