require('../../lib/debug/apply-line-numbers')(console)(['log', 'warn'], {
	prepend: true,
});
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const { initTestBed, userCollections } = require('@woke/test');
const { Logger, Deferral } = require('@woke/lib');
const { MockTweeter, CallbackMock, wasDispatched } = require('./mocks');
const NotificationSystem = require('../src/systems/notification-system');

const logger = Logger('test').d;
const users = userCollections.dummy;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const callbacks = {
	'transfer-unclaimed': () => {},
	'tip-seen': () => {},
	'tip-confirmed': () => {},
	'tip-invalid': () => {},
	'tip-failed': () => {},
};

context('funder-system', function () {
	let contractDomain, wokeDomain, notiSystem;

	before(async function () {
		const testBed = await initTestBed(users);
		contractDomain = testBed.contractDomain;
		wokeDomain = testBed.wokeDomain;
		await contractDomain.redeploy();
	});

	beforeEach(async function () {});

	afterEach(function () {
		// stop
		notiSystem.stop();
	});

	describe('notify recipient of transfer', function () {
		it('claimed to unclaimed', async function () {
			this.timeout(50000);

			const [from, to] = users.list();
			await wokeDomain.api.completeClaimUser(from);
			// await wokeDomain.api.completeClaimUser(to);

			const taskIsComplete = new Deferral();
			const onTaskComplete = (task) => {
				taskIsComplete.resolve(task);
			};

			notiSystem = new NotificationSystem({
				twitterEnv: 'fake',
				persist: false,
				sendFaultLogs: false,
				onTaskComplete,
				contractInstances: { UserRegistry: contractDomain.contracts.UserRegistry },
			});

			// Use mock tweeter actor to catch notification submission
			const mock_transferUnclaimed = CallbackMock(wasDispatched, 'tip was seen');
			const callbacks = {
				'transfer-unclaimed': mock_transferUnclaimed.callback,
			};
			director = notiSystem.getDirector();
			mockTweeter = MockTweeter(director)(callbacks);
			notiSystem.setTweeter(mockTweeter);

			await notiSystem.start();
			await wait(300);
			const amount = 5;
			logger(`Transfering ${amount} from ${from.id} to ${to.id}`);

			// Check notification is sent
			await wokeDomain.api.transfer(from, to, amount.toString());
			await taskIsComplete.promise;
			await mock_transferUnclaimed.deferred.promise;
		});

		it('claimed to claimed', async function () {
			// should not notify

			this.skip();
			// contractDomain.contracts.UserRegistry.events
			// 	.Tx({ fromBlock: 0 })
			// 	// .on('data', (e) => console.log('log', e));
			// 	.on('data', () => console.log('.................................'));
		});
	});
});
