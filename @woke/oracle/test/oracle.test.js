require('../../lib/debug/apply-line-numbers')(console)(['log', 'warn'], {
	prepend: true,
});
// console.keys = (arg) => console.log(Object.keys(arg));

const { ContractDomain, WokeDomain, Collection, userCollections } = require('@woke/test');
const { Logger, protocol, web3Tools, twitter } = require('@woke/lib');
const { ContractSystem } = require('@woke/web3-nact');
const OracleSystem = require('../src/oracle-system');

const users = userCollections.dummy;

const initTestBed = async (users) => {
	contractDomain = await ContractDomain().init();
	wokeDomain = await WokeDomain(contractDomain);
	users.assignAddresses(contractDomain.allocateAccounts(users.length));
	return {
		contractDomain,
		wokeDomain,
	};
};

const twitterClient = twitter.fake.FakeClient(0, { users: users.getMap() });

context('oracle-system', function () {
	let testBed, oracleSystem, director, c_oracle;
	before(async function () {
		testBed = await initTestBed(users);
	});

	beforeEach(async function () {
		// @TODO @IMPORTANT
		// The contract system is not going to work with these tests as it will load
		// the addresses from the json file
		//		-- add option to choose address
		//		-- or load from web3 contract object?

		// console.log(r);
		await testBed.contractDomain.redeploy();
		oracleSystem = new OracleSystem({
			oracleContractInstance: testBed.contractDomain.contracts.Oracle,
		});
		director = oracleSystem.director;
	});

	afterEach(function () {
		//director.stop();
	});

	it('should fulfill a valid user claim', async function () {
		const [user] = users.list();
		await oracleSystem.start();
		const wasClaimed = await testBed.wokeDomain.api.userIsClaimed(user);
		const { queryId, receipt } = await testBed.wokeDomain.api.sendClaimUser(user);

		const isClaimed = await testBed.wokeDomain.api.userIsClaimed(user);
		await web3Tools.utils.waitForEventWeb3(
			testBed.contractDomain.contracts.UserRegistry,
			'Claimed',
			receipt.blockNumber
		);
		console.log(`wasClaimed:${wasClaimed}, isClaimed:${isClaimed}`);
	});
});
