require('dotenv').config()
const { utils } = require('@woke/lib');
const networkList = {
	development: [],
	production: ['goerli_2', 'goerli_3', 'goerli_infura'],
	goerli: ['goerli_2', 'goerli_3', 'goerli_infura'],
};

module.exports = {
	persist: utils.parse_bool(process.env.PERSIST),
	networkList: networkList[process.env.ETH_ENV],
};
