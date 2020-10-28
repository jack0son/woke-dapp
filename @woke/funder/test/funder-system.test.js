require('../../lib/debug/apply-line-numbers')(console)(['log', 'warn'], {
	prepend: true,
});
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const { initTestBed, userCollections } = require('@woke/test');
const { Logger, Deferral } = require('@woke/lib');
const FunderSystem = require('../src/funder-system');
const logger = Logger('test').d;
const web3Utils = require('web3-utils');
const BN = web3Utils.BN;

const users = userCollections.dummy;

context('funder-system', function () {
	let contractDomain, fundingSystem;

	before(async function () {
		const testBed = await initTestBed(users);
		contractDomain = testBed.contractDomain;
	});

	beforeEach(async function () {});

	afterEach(function () {
		// stop
	});

	it('funds a user', async function () {
		this.timeout(50000);

		const [user] = users.list();
		const amount = web3Utils.toWei('2', 'ether');
		const balance = await contractDomain.instance.web3.eth.getBalance(user.address);
		logger(typeof balance);
		logger('initial balance =', balance);

		const deferred = new Deferral();
		const onFundingComplete = (job) => {
			deferred.resolve(job);
		};

		fundingSystem = new FunderSystem({
			fundAmount: amount,
			persist: false,
			sendFaultLogs: false,
			onFundingComplete,
		});
		await fundingSystem.start();
		fundingSystem.fundAccount(user.address, user.id);
		await deferred.promise;
		await expect(
			contractDomain.instance.web3.eth.getBalance(user.address).then((b) => new BN(b))
		).to.eventually.deep.equal(new BN(balance).add(new BN(amount)));
	});

	it('funds the original address used', async function () {
		this.skip();
	});
});
