const WokeDomain = require('./domains/woke');
const ContractDomain = require('./domains/contract');
const Collection = require('./collection.js');
const userCollections = require('./users');

const initTestBed = async (users) => {
	contractDomain = await ContractDomain().init('development');
	wokeDomain = await WokeDomain(contractDomain);
	console.log(users.list());
	console.log(users.length);
	// const acc = contractDomain.allocateAccounts(users.length);
	// console.log(acc);
	users.assignAddresses(contractDomain.allocateAccounts(users.list().length));
	// users.assignAddresses(acc);
	console.log(users.list());
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
