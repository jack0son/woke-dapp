const Service = require('./service');
const extensions = require('./extensions.js');
const serviceConf = require('./config/service-config.js');
const loadSecrets = require('./config/secrets');

module.exports = { Service, extensions, serviceConf, loadSecrets };
