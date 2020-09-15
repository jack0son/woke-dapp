const envPath = require('@woke/lib/utils').resolveEnvFilePath();
console.log(`Using envPath ${envPath}`);
require('dotenv').config({ path: envPath });

const { utils } = require('@woke/lib');
const {
	config: { networkList },
} = require('@woke/web3-nact');

module.exports = {
	networkList,
	persist: utils.parse_bool(process.env.PERSIST),
};
