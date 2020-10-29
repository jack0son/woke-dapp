const secrets = require('@woke/secrets');
process.env.FAULT_MONITORING &&
	secrets('twitter', process.env.TWITTER_APP || 'staging-oracle');

const { useMonitor } = require('@woke/actors');
var faultMonitor = useMonitor({ enabled: process.env.FAULT_MONITORING });

module.exports = faultMonitor;
