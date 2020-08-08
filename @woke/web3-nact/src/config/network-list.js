require('dotenv').config();
const networkLists = {
	development: [],
	production: ['goerli_2', 'goerli_3', 'goerli_infura'],
	goerli: ['goerli_3', 'goerli_2', 'goerli_infura'],
};

const NETWORK_LIST = process.env.NETWORK_LIST;

module.exports = {
	networkList: !!NETWORK_LIST
		? NETWORK_LIST.split(',')
		: networkLists[process.env.ETH_ENV],
};
