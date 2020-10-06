require('../../lib/debug/apply-line-numbers')(console)(['log', 'warn'], {
	prepend: true,
});
const twitter = require('@woke/twitter');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const should = chai.should();
const assert = chai.assert;

const TipSystem = require('../src/systems/tip-system');
const { initTestBed, ContractDomain, WokeDomain, Collection } = require('@woke/test');

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

// Catch job statuses from the tip supervisor instead of posting tweets
const MockTweeter = (director) => (callbacks) =>
	director.start_actor(
		'mock-tweeter',
		{
			actions: {
				tweet: (state, msg, ctx) => {
					//const msgExample = { type: 'tweet', tweetType: 'tip-seen', tip: {} };
					const { tweetType, tip } = msg;
					if (!tip) throw new Error('No tip provided by tip supervisor');
					if (!tweetType) throw new Error('No tweetType provided by tip supervisor');
					callbacks[tweetType] && callbacks[tweetType](tip);
				},
			},
			properties: {},
		},
		{}
	);

const callbacks = {
	'tip-seen': () => {},
	'tip-confirmed': () => {},
	'tip-invalid': () => {},
	'tip-failed': () => {},
};

const ExpectMutation = async (apiCall, initialXpt, diffXpt) => {
	const prev = await apiCall();
	initialXpt(prev);

	const expect = async () => {
		const next = await apiCall();
		return diffXpt(prev, next);
	};

	return expect;
};

// Expectations
// initial: (a) => assertion
// diff: (a,b) => assertion
let xpt = {};
xpt.gt = (v, a) => expect(v).to.be.above(a);
xpt.notNegative = (v) => expect(v).to.not.be.lt(0); // lol so wrong
xpt.nonZero = (v) => xpt.gt(v, 0);
xpt.changeBy = (amount) => (a, b) => expect(b - a).to.equal(amount);

// A bit of fun generalising expected state changes
// @param ctx: Whatever state domain's mutations need to be checked
const AppStateExpectations = (ctx) => {
	const { wokeDomain } = ctx;
	const balanceChangeBy = (user, amount, initialXpt = xpt.nonZero) =>
		ExpectMutation(
			() => wokeDomain.api.getUserBalance(user).then(Number),
			initialXpt, // initial state
			xpt.changeBy(amount) // state diff
		);

	return {
		balanceChangeBy,
	};
};

const CallbackMock = (deferredCallback, msg) => {
	const deferred = new Deferral();
	return {
		callback: deferredCallback(deferred, msg),
		deferred,
	};
};

// @param expectedTip: passed by mockTweeter target function
const wasDispatched = (deferred, msg) => (expectedTip) => {
	logger(msg);
	//expect(tip).to.deep.equal(expectedTip);
	logger(expectedTip);
	deferred.resolve();
};

const wasNotDispatched = (deferred) => (expectedTip) => {
	deferred.reject();
};

const makeTipText = (to, amount) =>
	`@${to.screen_name} Have these wokens +${amount} $WOKE`;

// Chain Domain Test-modes
// 1. integration: contract state persists between tests (for testing service
//    apis)
// 2. unit: stateful contracts redeployed between tests (@TODO);

context('tip-system', function () {
	let wokeDomain, contractDomain, tipSystem, director, mockTweeter;

	// Assert failure from inside a catch block (e.g. nact actor's handle function)
	const expectNotCalled = (msg, callback) =>
		function (...args) {
			callback(...args);
			this.test.callback(new Error(msg));
		};

	before(async function () {
		// Initialise test bed
		const testBed = await initTestBed(users);
		wokeDomain = testBed.wokeDomain;
		contractDomain = testBed.contractDomain;
	});

	beforeEach(async function () {
		this.timeout(50000);
		//contractDomain.reset();
		await contractDomain.redeploy();

		twitterClient = twitter.fake.FakeClient(0);
		tipSystem = new TipSystem({
			contractInstances: { UserRegistry: contractDomain.contracts.UserRegistry },
			faultMonitoring: false,
			twitterClient,
		});
		director = tipSystem.getDirector();

		expectMutation = AppStateExpectations({ wokeDomain });
	});

	afterEach(function () {
		director.stop();
	});

	describe('claimedUser', function () {
		it('tip an unclaimed user', async function () {
			this.timeout(50000);
			// Setup notifier callbacks
			const tipSeen = CallbackMock(wasDispatched, 'tip was seen');
			const tipConfirmed = CallbackMock(wasDispatched, 'tip was confirmed');

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

			const tipTweet = tipTweets[0];
			const [fromUser, toUser] = users.list();
			await wokeDomain.api.completeClaimUser(fromUser);
			const amount = 2;

			// 1. Remember user's initial on-chain state
			const mutations = [
				await expectMutation.balanceChangeBy(fromUser, amount * -1),
				await expectMutation.balanceChangeBy(toUser, amount, xpt.notNegative),
			];

			// 2. Post the tip to twitter
			const tipText = makeTipText(toUser, 2);
			await twitterClient.updateStatus(tipText, { user: fromUser, mention: toUser });

			// 3. Confirm tweet notifications were sent
			const cbs = [tipSeen, tipConfirmed].map((c) => c.deferred.promise);
			logger(cbs);
			logger(mutations);
			await Promise.all(mutations);
			await Promise.all(cbs);

			// Resolve deferred promises
			//expectNotFulfilled() - should use a sinnon spy / mock
		});

		/*
		it('tip a claimed user', async function () {
			const tipTweet = tipTweets[0];
			const [fromUser, toUser] = users.list();
			await wokeDomain.api.claimUser(fromUser);
			await wokeDomain.api.claimUser(toUser);
		});

		it('reject an invalid tip', function () {});

		it('reject unclaimed user tip', function () {});

		it('reject broke user tip', function () {});
		*/
	});
});
