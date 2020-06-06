const { genRandomUserId } = require('../test/utils');
const WokeContract = require('./WokeContracts');
const tributorData = require('./data-tributors');


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
