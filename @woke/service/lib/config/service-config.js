const {
	utils: { resolveEnvFilePath, parse_bool },
	configure,
} = require('@woke/lib');
// const envPath = resolveEnvFilePath();
// require('dotenv').config({ path: envPath });
//console.log(`Using envPath ${envPath}`);

require('dotenv').config();
const secrets = require('@woke/secrets');

const parseNetworkList = (str) =>
	str && str.length ? (!!str.split ? str.split(',').map((n) => n.trim()) : str) : [];

// @TODO allow passing config options per service
// env var specs
const envVars = [
	['PERSIST', 'persist', parse_bool],
	['PRINT_CONFIG', 'printConfig', parse_bool],
	['FAULT_MONITORING', 'faultMonitoring', parse_bool],
	['LOGGER_STRING', 'loggerString'],
	['NETWORK_LIST', 'networkList', parseNetworkList],
	['TWITTER_MENTIONS', 'muffled'],
	['WEB3_RESUBSCRIBE_INTERVAL', 'resubscribeInterval', parseInt],
	['VERBOSE', 'verbose', parse_bool],
	['NOTIFICATIONS_SEEN', 'sendSeenNotifications', parse_bool],
	['EARLIEST_TIP_ID', 'earliestTipId', parseInt],
	['TWITTER_POLLING_INTERVAL', 'pollingInterval'],
	['TWITTER_ENV', 'twitterEnv'],
	['TWITTER_APP', 'twitterApp'],
	['TWITTER_ENV', 'twitterEnv'], // fake client or real client
	['ETH_ENV', 'ethEnv'],
];

// Any env vars we can get at the CLI
const commandLineArgs = require('../cli')(envVars.map((v) => v.slice(1)));

const envOptions = envVars.reduce((opts, [varName, key, parser]) => {
	const opt = process.env[varName];
	opts[key] = parser ? parser(opt) : opt;
	return opts;
}, Object.create(null));

const conf = configure(commandLineArgs, envOptions);

// secrets('twitter', conf.twitterApp || 'oracle-bot');
// secrets('ethereum', conf.ethEnv || 'ganache');
// secrets('infura');
//console.log(secrets.get());

// Config meets the following requirements
// 1. [x] Able to toggle conf in docker compose file
// 2. [x] Able to switch between different key sets
// 3. [x] Prioritise CLI options over environment options
// 4. [ ] Should map the conf options back on to process.env
//				(so that modules relying on dotenv have access)
// 5. [ ] Should allow passing of additional env var specs
module.exports = conf;
