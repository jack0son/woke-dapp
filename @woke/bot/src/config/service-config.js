const envPath = require('@woke/lib/utils').resolveEnvFilePath();
console.log(`Using envPath ${envPath}`);
require('dotenv').config({ path: envPath });

const { utils } = require('@woke/lib');
const {
	config: { networkList },
} = require('@woke/web3-nact');

const { PERSIST, FAULT_MONITORING, TWITTER_ENV } = process.env;

module.exports = {
	networkList,
	persist: utils.parse_bool(PERSIST),
	faultMonitoring: utils.parse_bool(FAULT_MONITORING),
	twitterEnv: TWITTER_ENV,
};
