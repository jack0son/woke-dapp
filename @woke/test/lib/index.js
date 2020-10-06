const WokeDomain = require('./domains/woke');
const ContractDomain = require('./domains/contract');
const Collection = require('./collection.js');
const userCollections = require('./users');

const initTestBed = async (users) => {
	contractDomain = await ContractDomain().init('development');
	wokeDomain = await WokeDomain(contractDomain);
	users.assignAddresses(contractDomain.allocateAccounts(users.length));
	return {
		contractDomain,
		wokeDomain,
	};
};

module.exports = {
	initTestBed,
	WokeDomain,
	ContractDomain,
	Collection,
	userCollections,
};
