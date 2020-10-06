require('../../lib/debug/apply-line-numbers')(console)(['log', 'warn'], {
	prepend: true,
});
const { initTestBed, userCollections } = require('@woke/test');
const { Deferral } = require('@woke/lib');

const users = userCollections.dummy;

context('funder-system', function () {
	let contractDomain, fundingSystem;

	before(async function () {
		const testBed = initTestBed(users);
		contractDomain = testBed.contractDomain;
	});

	beforeEach(async function () {});

	afterEach(function () {
		// stop
	});

	it('funds a user', async function () {
		const [user] = users.list();
		const balance = await contractDomain.instance.web3.eth.getBalance(user.address);

		const deferred = new Deferral();
		const onFundingComplete = (job) => {
			deferred.resolve(job);
		};

		fundingSystem = new FunderSystem(undefined, { persist: false, sendFaultLogs: false });
		await fundingSystem.start();
		await deferred.promise;
	});
});
