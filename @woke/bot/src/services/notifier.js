const { loadSecrets, serviceConf } = require('@woke/service');
const NotificationSystem = require('../systems/notification-system');
loadSecrets(['infura', 'ethereum', 'twitter'], serviceConf);

const bootstrap = () => {
	const notiSystem = new NotificationSystem(serviceConf);
	return notiSystem.start();
};

bootstrap().catch(console.log);
