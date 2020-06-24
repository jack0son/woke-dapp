require('dotenv').config()
const networkList = {
	development: [],
	production: ['goerli_2', 'goerli_3', 'goerli_infura'],
	goerli: ['goerli_2', 'goerli_3', 'goerli_infura'],
};

const NETWORK_LIST = process.env.NETWORK_LIST;

module.exports = {
	networkList: !!NETWORK_LIST ? NETWORK_LIST.split(',') : networkList[process.env.ETH_ENV],
};
