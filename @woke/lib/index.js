const Logger = require('./debug');
const utils = require('./utils');
const merge = require('./merge');
const configure = require('./configure');
const emojis = require('./emojis');
const messageTemplates = require('./message-templates');

const protocol = require('./woke/protocol');
const TwitterDomain = require('./domains/twitter');
const web3Tools = require('./web3-tools');

module.exports = {
	web3Tools,
	Logger,
	protocol,
	TwitterDomain,
	utils,
	merge,
	configure,
	emojis,
	messageTemplates,
};
