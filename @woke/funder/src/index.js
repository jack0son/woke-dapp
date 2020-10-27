const secrets = require('@woke/secrets');
secrets('ethereum', process.env.ETH_ENV || process.env.NODE_ENV);

const { configure } = require('@woke/lib');
const { loadSecrets, serviceConf } = require('@woke/service');
const FunderSystem = require('./funder-system');
const opts = require('./config');
const conf = configure(opts, serviceConf);

loadSecrets(['infura', 'ethereum'], conf);

// @TODO parse polling interval
module.exports = () => new FunderSystem(conf);
