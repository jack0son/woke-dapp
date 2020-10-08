const { Logger } = require('@woke/lib');
const { loadSecrets } = require('@woke/service');
const FunderSystem = require('./funder-system');
const conf = require('./config');

loadSecrets(['infura', 'ethereum']);

// @TODO parse polling interval
module.exports = () => new FunderSystem(conf);
