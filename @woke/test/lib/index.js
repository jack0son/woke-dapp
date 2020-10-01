const woke = require('./woke');
const chain = require('./chain');
const Collection = require('./collection.js');
const userCollections = require('./users');

module.exports = {
	WokeDomain: woke,
	ChainDomain: chain,
	Collection,
	userCollections,
};
