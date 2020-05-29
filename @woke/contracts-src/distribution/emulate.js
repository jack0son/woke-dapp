const { genRandomUserId } = require('../test/utils');
const WokeContract = require('./WokeContracts');
const tributorData = require('./data-tributors');

const BN = require('bn.js');

const max256bitValStr = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

let b = new BN(0, 16);
console.log(b.byteLength() * 8);
b = new BN(max256bitValStr, 16);
console.log(b.bitLength());
console.log(b.toString());
console.log(b.toTwos(8));
b.iaddn(2);
console.log(b.toTwos(8));
console.log(b.fromTwos(8).toString());
console.log(b.bitLength());

const curveParams = {
	maxSupply: 4.2e6,
	maxPrice: 210,						// a/2
	inflectionSupply: 2.72e6, // b
	steepness: 1.4e9,					// c
	useLnpdfApproximation: false,
};

const tributors = tributorData.even;
tributors.forEach(t => t.id = genRandomUserId());

const contract = new WokeContract(curveParams);

tributors.forEach(t => {
	contract.claimUser(t.id, t.followers);
})
