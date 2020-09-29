const j0 = require('@woke/jack0son');
const twitter = require('@woke/twitter');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();
const expect = chai.expect();

const collection = function () {};
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
		...u,
		id: user.id_str,
	};
	idx[u.id] = u;
	return u;
};

const tweetsToUsers = (tweets) =>
	tweets.reduce((users, tweet) => {
		if (j0.notEmpty(tweet.entities.user_mentions))
			tweet.entities.user_mentions.forEach(extractUser(users));
		if (!users[tweet.user.id_str]) extractUser(users)(tweet.user);
	}, Object.create(null));

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

const AppStateExpectations = (appState) => {
	const balanceChangeBy = (user, amount) =>
		ExpectMutation(appState.api.getUserBalance, [user], xpt.nonZero, changeBy(amount));

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

const users = Collection('test-users', tweetsToUsers(tipTweets));

const makeTipText = (to, amount) =>
	`@${to.screen_name} Have these wokens +${amount} $WOKE`;

context('tip-system', function () {
	let appState, chainState, tipSystem, director, mockTweeter, appStateExpectations;

	before(async function () {
		// Initialise test bed
		chainState = ChainState();
		appState = AppState();
	});

	beforeEach(async function () {
		chainState.reset();
		appState.init(chainState);
		users.assignAddresses(await chainState.getAccounts());
		twitterClient = twitter.fake.client(0);
		tipSystem = new TipSystem({
			twitterClient,
		});
		director = tipSystem.getDirector();
		mockTweeter = MockTweeter(director);
		await tipSystem.setTweeter(mockTweeter);
		await tipSystem.start();

		expectMutation = AppStateExpectations(appState);
	});

	describe('claimedUser', function () {
		it('tip an unclaimed user', async function () {
			// Setup notifier callbacks

			const callbacks = {
				'tip-seen': wasDispatched(),
				'tip-confirmed': {},
				'tip-invalid': {},
				'tip-failed': {},
			};

			const tipTweet = tipTweets[0];
			const [fromUser, toUser] = users.list();
			await appState.api.claimUser(fromUser);
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
			await appState.api.claimUser(fromUser);
			await appState.api.claimUser(toUser);
		});

		it('reject an invalid tip', function () {});

		it('reject unclaimed user tip', function () {});

		it('reject broke user tip', function () {});
	});
});
