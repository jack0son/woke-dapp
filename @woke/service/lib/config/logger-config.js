const { Logger } = require('@woke/lib');
let logger = Logger();

const defaultEnable = 'actor*,sys_*';

function configureLogger({ enableString, disable }) {
	if (disable) {
		logger.control.debug.disable();
	} else {
		logger.control.debug.enable(enableString || defaultEnable);
	}

	logger = null;
}

module.exports = configureLogger;
