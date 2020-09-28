const {
	utils: { resolveEnvFilePath, parse_bool },
	configure,
} = require('@woke/lib');
const envPath = resolveEnvFilePath();
const secrets = require('@woke/secrets');

console.log(`Using envPath ${envPath}`);
require('dotenv').config({ path: envPath });

const commandLineArgs = require('../lib/cli');

const {
	PERSIST,
	FAULT_MONITORING,
	TWITTER_ENV,
	TWITTER_MENTIONS,
	VERBOSE,
	TWITTER_APP,
} = process.env;
const environmentOptions = {
	persist: parse_bool(PERSIST),
	faultMonitoring: parse_bool(FAULT_MONITORING),
	twitterEnv: TWITTER_ENV,
	verbose: parse_bool(VERBOSE),
	muffled: parse_bool(TWITTER_MENTIONS),
	twitterApp: TWITTER_APP,
};

const {
	config: { networkList },
} = require('@woke/web3-nact');

const conf = {
	networkList,
	...configure(commandLineArgs, environmentOptions),
};
secrets('twitter', conf.twitterApp || 'oracle-bot');

// Config meets the following requirements
// 1. Able to toggle conf in docker compose file
// 2. Able to switch between different key sets
// 3. Able to

module.exports = conf;
