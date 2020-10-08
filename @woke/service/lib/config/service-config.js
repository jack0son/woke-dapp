const {
	utils: { resolveEnvFilePath, parse_bool },
	configure,
} = require('@woke/lib');
// const envPath = resolveEnvFilePath();
// require('dotenv').config({ path: envPath });
//console.log(`Using envPath ${envPath}`);

require('dotenv').config();
const secrets = require('@woke/secrets');

const envVars = [
	['PERSIST', 'persist', parse_bool],
	['FAULT_MONITORING', 'faultMonitoring', parse_bool],
	['TWITTER_MENTIONS', 'muffled'],
	['VERBOSE', 'verbose', parse_bool],
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
// 1. Able to toggle conf in docker compose file
// 2. Able to switch between different key sets
// 3. Prioritise CLI options over environment options
module.exports = conf;
