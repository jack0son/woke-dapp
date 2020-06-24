const actors = require('./actors');
const utils = require('./lib/utils');
const ContractsSystem = require('./systems/contracts-system');
const config = require('./config/network-list');

module.exports = {
	...actors,
	utils,
	ContractsSystem,
	config,
};
