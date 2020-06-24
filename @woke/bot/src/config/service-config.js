require('dotenv').config()
const { utils } = require('@woke/lib');
const { config: { networkList } } = require('@woke/web3-nact');

module.exports = {
	networkList,
	persist: utils.parse_bool(process.env.PERSIST),
};
