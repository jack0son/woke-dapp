require('../../lib/debug/apply-line-numbers')(console)(['log', 'warn'], {
	prepend: true,
});
// require('../../lib/debug/suppress')(console, ['log']);

const twitter = require('@woke/twitter');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const should = chai.should();
const assert = chai.assert;

const TipSystem = require('../src/systems/tip-system');
const { initTestBed, ContractDomain, WokeDomain, Collection } = require('@woke/test');
const { MockTweeter, CallbackMock, wasDispatched } = require('./mocks');

const {
	tweeter: { Tweeter },
} = require('@woke/actors');
const { Logger, Deferral } = require('@woke/lib');
const { makeUserCollectionFromTweets } = require('./helpers');
const logger = Logger('test').d;

const tipTweets = twitter.fake.data.tipTweets;
const users = makeUserCollectionFromTweets(tipTweets);

const logUsers = (users) =>
	logger(
		users.map(({ id, screen_name, followers_count }) => ({
			id,
			screen_name,
			followers_count,
		}))
	);

const ExpectMutation = async (apiCall, initialXpt, diffXpt, msg = '') => {
	const prev = await apiCall();
	initialXpt(prev);

	const expect = async () => {
		const next = await apiCall();
		msg && logger('Expect', msg);
		return diffXpt(prev, next);
	};

	return expect;
};

// Expectations
// initial: (a) => assertion // diff: (a,b) => assertion
let xpt = {};
xpt.gt = (v, a) => expect(v).to.be.above(a);
xpt.notNegative = (v) => expect(v).to.not.be.lt(0); // lol so wrong
xpt.nonZero = (v) => xpt.gt(v, 0);
xpt.changeBy = (amount) => (a, b) => expect(b - a).to.equal(amount);

// A bit of fun generalising expected state changes
// @param ctx: Whatever state domain's mutations need to be checked
const AppStateExpectations = (ctx) => {
	const { wokeDomain } = ctx;
	const balanceChangeBy = (user, amount, msg = '', initialXpt = xpt.nonZero) =>
		ExpectMutation(
			() => wokeDomain.api.getUserBalance(user),
			initialXpt, // initial state
			xpt.changeBy(amount), // state diff
			msg
		);

	return {
		balanceChangeBy,
	};
};

const makeTipText = (to, amount) =>
	`@${to.screen_name} Have these wokens +${amount} $WOKE`;

// Chain Domain Test-modes
// 1. integration: contract state persists between tests (for testing service
//    apis)
// 2. unit: stateful contracts redeployed between tests (@TODO);

context('tip-system', function () {
	let wokeDomain, contractDomain, tipSystem, director, mockTweeter;
	let i = 0;

	// Assert failure from inside a catch block (e.g. nact actor's handle function)
	const expectNotCalled = (msg, callback) =>
		function (...args) {
			callback(...args);
			this.test.callback(new Error(msg));
		};

	before(async function () {
		this.timeout(5000);
		// Initialise test bed
		const testBed = await initTestBed(users);
		wokeDomain = testBed.wokeDomain;
		contractDomain = testBed.contractDomain;
		await contractDomain.redeploy();
	});

	beforeEach(async function () {
		this.timeout(5000);
		//contractDomain.reset();

		twitterClient = twitter.fake.FakeClient(0, { rateLimit: 100 });
		tipSystem = new TipSystem({
			contractInstances: { UserRegistry: contractDomain.contracts.UserRegistry },
			faultMonitoring: false,
			twitterClient,
			pollingInterval: 100,
			directorOptions: { name: `director-${(i++).toString().padStart(3, '0')}` },
		});
		director = tipSystem.getDirector();

		expectMutation = AppStateExpectations({ wokeDomain });
	});

	afterEach(function () {
		director.stop();
	});

	function validTip() {
		return async (fromUser, toUser, amount = 2) => {
			const tipSeen = CallbackMock(wasDispatched, 'tip was seen');
			const tipConfirmed = CallbackMock(wasDispatched, 'tip was confirmed');
			director = tipSystem.getDirector();

			const getReason = (tip) => logger('Reason', tip.reason);
			const callbacks = {
				'tip-seen': tipSeen.callback,
				'tip-confirmed': tipConfirmed.callback,
				'tip-invalid': expectNotCalled('Tip should not be invalid', getReason).bind(this),
				'tip-failed': expectNotCalled('Tip should not fail', getReason).bind(this),
			};

			mockTweeter = MockTweeter(director)(callbacks);
			await tipSystem.setTweeter(mockTweeter);
			await tipSystem.start();

			// 1. Remember user's initial on-chain state
			const mutations = [
				await expectMutation.balanceChangeBy(
					fromUser,
					amount * -1,
					'sender balance decrease'
				),
				await expectMutation.balanceChangeBy(
					toUser,
					amount,
					'recipient balance increase',
					xpt.notNegative
				),
			];

			// 2. Post the tip to twitter
			const tipText = makeTipText(toUser, 2);
			await twitterClient.updateStatus(tipText, { user: fromUser, mention: toUser });

			// 3. Confirm tweet notifications were sent
			await Promise.all([tipSeen, tipConfirmed].map((c) => c.deferred.promise));

			// 4. Confirm tokens were transferred
			await Promise.all(mutations.map((m) => m()));
		};
	}

	describe('claimedUser', function () {
		it('tip an unclaimed user', async function () {
			this.timeout(5000);
			const [fromUser, toUser] = users.list();
			await wokeDomain.api.completeClaimUser(fromUser);
			await validTip()(fromUser, toUser);
			// Setup notifier callbacks
		});

		it('tip a claimed user', async function () {
			this.timeout(5000);

			// Resolve deferred promises
			// expectNotFulfilled() - should use a sinnon spy / mock
			const [fromUser, toUser] = users.list();
			await wokeDomain.api.completeClaimUser(toUser);
			await validTip()(fromUser, toUser);
		});

		/*
		it('reject an invalid tip', function () {});

		it('reject unclaimed user tip', function () {});

		it('reject broke user tip', function () {});
		*/
	});
});
