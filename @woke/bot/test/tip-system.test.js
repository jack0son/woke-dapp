const j0 = require('@woke/jack0son');
const twitter = require('@woke/twitter');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();
const expect = chai.expect();

const TipSystem = require('../src/systems/tip-system');
const { ChainDomain, WokeDomain, Collection } = require('@woke/test');

const {
	tweeter: { Tweeter },
} = require('@woke/actors');
const Deferral = require('@woke/wact/src/lib/deferral');

const tipTweets = twitter.fake.data.tipTweets;

const extractRecipient = (tweet) => ({
	id: tweet.entities.user_mentions[0].id_str,
	handle: tweet.entities.user_mentions[0].screen_name,
});

const extractUser = (idx) => (user) => {
	let u = {
		...user,
		id: user.id_str,
	};
	idx[u.id] = u;
	return u;
};

// Extract user objects from our tweets pulled from twitter
const tweetsToUserIndex = (tweets) =>
	tweets.reduce((users, tweet) => {
		if (j0.notEmpty(tweet.entities.user_mentions))
			tweet.entities.user_mentions.forEach(extractUser(users));
		if (!users[tweet.user.id_str]) extractUser(users)(tweet.user);
		return users;
	}, Object.create(null));

// Catch job statuses from the tip supervisor instead of posting tweets
const MockTweeter = (director) => (callbacks, expectedTypes) =>
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

const wasDispatched = (deferred, expectedTip) => (tip) => {
	//expect(tip).to.deep.equal(expectedTip);
	deffered.resolve();
};

const ExpectMutation = async (apiCall, [args], initial, final) => {
	const prev = await apiCall(...args);
	initial(prev);

	const expect = async () => {
		const next = await apiCall(...args);
		final(prev, next);
	};

	return expect;
};

let xpt = {};
xpt.gt = (v, a) => v.should.be.above(a);
xpt.nonZero = (v) => gt(v, 0);
xpt.changeBy = (amount) => (a, b) => expect(b - a).to.equal(amount);

const AppStateExpectations = (wokeDomain) => {
	const balanceChangeBy = (user, amount) =>
		ExpectMutation(wokeDomain.api.getUserBalance, [user], xpt.nonZero, changeBy(amount));

	return {
		balanceChangeBy,
	};
};

const callbacks = {
	'tip-seen': () => {},
	'tip-confirmed': () => {},
	'tip-invalid': () => {},
	'tip-failed': () => {},
};

const CallbackMock = (deferredCallback) => {
	const deferred = new Deferral();
	return {
		callback: callback(deferred),
		deferred,
	};
};

const userIndex = tweetsToUserIndex(tipTweets);
const users = Collection(Object.values(userIndex));

const makeTipText = (to, amount) =>
	`@${to.screen_name} Have these wokens +${amount} $WOKE`;

// Chain Domain Test-modes
// 1. integration: contract state persists between tests (for testing service
//    apis)
// 2. unit: stateful contracts redeployed between tests (@TODO);

context('tip-system', function () {
	let wokeDomain, chainDomain, tipSystem, director, mockTweeter, wokeDomainExpectations;

	before(async function () {
		// Initialise test bed
		chainDomain = ChainDomain();
		await chainDomain.init();
		users.assignAddresses(await chainDomain.allocateAccounts(3));
		wokeDomain = await WokeDomain(chainDomain);
	});

	beforeEach(async function () {
		//chainDomain.reset();
		twitterClient = twitter.fake.FakeClient(0);
		tipSystem = new TipSystem({
			faultMonitoring: false,
			twitterClient,
		});
		director = tipSystem.getDirector();
		mockTweeter = MockTweeter(director);
		await tipSystem.setTweeter(mockTweeter);
		await tipSystem.start();

		expectMutation = AppStateExpectations(wokeDomain);
	});

	afterEach(function () {
		director.stop();
	});

	describe('claimedUser', function () {
		it('tip an unclaimed user', async function () {
			// Setup notifier callbacks

			const callbacks = {
				'tip-seen': wasDispatched(),
				'tip-confirmed': () => {},
				'tip-invalid': () => {},
				'tip-failed': () => {},
			};

			const tipTweet = tipTweets[0];
			const [fromUser, toUser] = users.list();
			console.log(wokeDomain);
			await wokeDomain.api.claimUser(fromUser);
			const amount = 2;

			// Expect user balances to change
			const mutations = [
				await expectMutation.balanceChangeBy(fromUser, amount * -1),
				await expectMutation.balanceChangeBy(toUser, amount),
			];

			const tipText = makeTipText(toUser, 2);
			console.log('tipText', tipText);
			// Now send the tip
			await twitterClient.updateStatus(tipText, { user: fromUser, mention: toUser });
			//const effectCallbacks =

			await Promise.all(effectDefferals);
			await Promise.all(mutations.map((m) => m.expect()));
		});

		it('tip a claimed user', async function () {
			const tipTweet = tipTweets[0];
			const [fromUser, toUser] = users.list();
			await wokeDomain.api.claimUser(fromUser);
			await wokeDomain.api.claimUser(toUser);
		});

		it('reject an invalid tip', function () {});

		it('reject unclaimed user tip', function () {});

		it('reject broke user tip', function () {});
	});
});
