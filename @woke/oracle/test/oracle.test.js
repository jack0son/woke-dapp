require('../../lib/debug/apply-line-numbers')(console)(['log', 'warn'], {
	prepend: true,
});
console.keys = (arg) => console.log(Object.keys(arg));
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const {
	initTestBed,
	ContractDomain,
	WokeDomain,
	Collection,
	userCollections,
} = require('@woke/test');
const { Logger, protocol, web3Tools } = require('@woke/lib');
const twitter = require('@woke/twitter');
const { ContractSystem } = require('@woke/web3-nact');
const OracleSystem = require('../src/oracle-system');

const users = userCollections.dummy;

const twitterClient = twitter.fake.FakeClient(0, { users: users.getDictionary() });

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
		await contractDomain.redeploy();
		oracleSystem = new OracleSystem({
			twitterClient,
			oracleContractInstance: contractDomain.contracts.Oracle,
		});
		director = oracleSystem.director;
	});

	afterEach(function () {
		director.stop();
	});

	it('should fulfill a valid user claim', async function () {
		this.timeout(50000);

		const [user] = users.list();
		const claimString = await wokeDomain.api.userClaimString(user);
		twitterClient.updateStatus(claimString, { user });
		await expect(wokeDomain.api.userIsClaimed(user)).to.eventually.equal(
			false,
			'user is already claimed'
		);

		// 1. Start the oracle
		await oracleSystem.start();

		// 2. Submit claim request
		let { queryId, receipt } = await wokeDomain.api.sendClaimUser(user);
		const tweetStored = await web3Tools.utils.waitForNextEvent(
			contractDomain.contracts.Oracle
		)('TweetStored', receipt.blockNumber);
		expect(tweetStored.returnValues.queryId).to.equal(queryId);
		expect(tweetStored.returnValues.statusId).to.equal(user.id);

		receipt = await wokeDomain.api.sendFulfillClaim(user);
		await expect(wokeDomain.api.userIsClaimed(user)).to.eventually.equal(
			true,
			'user was not claimed'
		);
	});

	/*
	it(
		('',
		async function () {
		// let emitter = contractDomain.contracts.UserRegistry.events
		// 	.Lodged({ fromBlock: 0, filter: {} })
		// 	.on('data', function (event) {
		// 		console.log('emitter', event); // same results as the optional callback above
		// 	});
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
	*/
});
