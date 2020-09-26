const {
	utils: { resolveEnvFilePath, parse_bool },
	configure,
} = require('@woke/lib');
const envPath = resolveEnvFilePath();
console.log(`Using envPath ${envPath}`);
require('dotenv').config({ path: envPath });
const commandLineArgs = require('../lib/cli');

const { PERSIST, FAULT_MONITORING, TWITTER_ENV, TWITTER_MENTIONS, VERBOSE } = process.env;
const environmentOptions = {
	persist: parse_bool(PERSIST),
	faultMonitoring: parse_bool(FAULT_MONITORING),
	twitterEnv: TWITTER_ENV,
	verbose: parse_bool(VERBOSE),
	muffled: parse_bool(TWITTER_MENTIONS),
};

const {
	config: { networkList },
} = require('@woke/web3-nact');

module.exports = {
	networkList,
	...configure(commandLineArgs, environmentOptions),
};
