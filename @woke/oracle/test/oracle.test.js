require('../../lib/debug/apply-line-numbers')(console)(['log', 'warn'], {
	prepend: true,
});
console.keys = (arg) => console.log(Object.keys(arg));

const { ContractDomain, WokeDomain, Collection, userCollections } = require('@woke/test');
const { Logger, protocol, web3Tools } = require('@woke/lib');
const twitter = require('@woke/twitter');
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

function postClaimTweet() {}

context('oracle-system', function () {
	let wokeDomain, contractDomain, oracleSystem, director, c_oracle;
	before(async function () {
		const testBed = await initTestBed(users);
		wokeDomain = testBed.wokeDomain;
		contractDomain = testBed.contractDomain;
	});

	beforeEach(async function () {
		this.timeout(50000);
		// @TODO @IMPORTANT
		// The contract system is not going to work with these tests as it will load
		// the addresses from the json file
		//		-- add option to choose address
		//		-- or load from web3 contract object?

		// console.log(r);
		await contractDomain.redeploy();
		contractDomain.logAddresses();
		oracleSystem = new OracleSystem({
			twitterClient,
			oracleContractInstance: contractDomain.contracts.Oracle,
		});
		director = oracleSystem.director;
	});

	afterEach(function () {
		//director.stop();
	});

	it('should fulfill a valid user claim', async function () {
		this.timeout(50000);
		// let emitter = contractDomain.contracts.UserRegistry.events
		// 	.Lodged({ fromBlock: 0, filter: {} })
		// 	.on('data', function (event) {
		// 		console.log('emitter', event); // same results as the optional callback above
		// 	});

		const [user] = users.list();
		//await wokeDomain.api.completeClaimUser(user);
		const claimString = await wokeDomain.api.userClaimString(user);
		twitterClient.updateStatus(claimString, { user });
		const wasClaimed = await wokeDomain.api.userIsClaimed(user);

		// 1. Start the oracle
		await oracleSystem.start();
		// 2. Submit claim request
		let { queryId, receipt } = await wokeDomain.api.sendClaimUser(user);
		let ts = await web3Tools.utils.waitForNextEvent(contractDomain.contracts.Oracle)(
			'TweetStored',
			receipt.blockNumber
		);
		console.log('GOT TS EVENT', ts);

		receipt = await wokeDomain.api.sendFulfillClaim(user);
		const isClaimed = await wokeDomain.api.userIsClaimed(user);
		// await web3Tools.utils.waitForNextEvent(contractDomain.contracts.UserRegistry)(
		// 	'Claimed',
		// 	receipt.blockNumber
		// );

		console.log(`wasClaimed:${wasClaimed}, isClaimed:${isClaimed}`);
	});

	if (
		('',
		async function () {
			const subscription = web3Tools.utils.makeLogEventSubscription(
				contractDomain.instance.web3
			)(
				contractDomain.contracts.UserRegistry,
				'Claimed',
				(err, event) => {
					console.log(err);
					console.log('sub', event);
				},
				{ fromBlock: 0, filter: {} }
			);
			subscription.start();
		})
	);
});
