require('dotenv').config();
const { Logger, TwitterDomain } = require('@woke/lib');
const twitter = require('@woke/twitter').client;
const bindApi = require('@woke/api');
const { twitterUsers, fetchUserHandles } = require('./twitter');
const utils = require('./utils');
const artifacts = require('@woke/contracts')[
	process.env.ETH_ENV || process.env.NODE_ENV || 'development'
];

const debug = Logger('cli');
debug.d(
	'Interfaces available on networks: ',
	Object.keys(artifacts.UserRegistry.networks)
);

const oracleInterface = artifacts.TwitterOracleMock;
const userRegistryInterface = artifacts.UserRegistry;
const wokeTokenInterface = artifacts.WokeToken;

const printId = (id) => id.padEnd(20, ' ');
const printHandle = (id) => id.padEnd(20, ' ');
const printFollowers = (f) => f.toString().padStart(12, ' ');
const printAmount = (f) => f.toString().padStart(24, ' ');

async function initContext() {
	const web3Instance = await utils.initWeb3();
	const contracts = {
		TwitterOracle: utils.initContract(web3Instance, oracleInterface),
		UserRegistry: utils.initContract(web3Instance, userRegistryInterface),
		WokeToken: utils.initContract(web3Instance, wokeTokenInterface),
	};
	await twitter.initClient();

	return {
		web3Instance,
		api: {
			TwitterOracle: bindApi.TwitterOracle(contracts.TwitterOracle),
			WokeToken: bindApi.WokeToken(contracts.WokeToken),
			UserRegistry: bindApi.UserRegistry(contracts.UserRegistry),
		},
		contracts,
		twitterUsers: twitterUsers(twitter),
		twitterDomain: new TwitterDomain(twitter),
	};
}

// Inefficient but convenient
const Commands = (ctx) => ({
	supply: async (showMintEvents) => {
		const supply = await ctx.api.WokeToken.getTokenSupply();
		const bonusPool = await ctx.api.UserRegistry.getUnclaimedPool();

		if (showMintEvents) {
			const claimedEvents = await ctx.api.UserRegistry.getClaimedEvents();
			const summonedEvents = await ctx.api.WokeToken.getSummonedEvents();

			let claimedTotal = 0;
			claimedEvents.forEach((e) => {
				console.log(
					`${printId(e.returnValues.userId)}:\t${printAmount(e.returnValues.amount)} W`
				);
				claimedTotal += parseInt(e.returnValues.amount);
			});

			let summonedTotal = 0;
			summonedEvents.forEach((e) => {
				console.log(
					`${e.returnValues.account}:\t${printAmount(e.returnValues.amount)} W`
				);
				summonedTotal += parseInt(e.returnValues.amount);
			});

			console.log(`\nTotal summoned: ${summonedTotal}, burned ${summonedTotal - supply}`);
			console.log(`Total claimed: ${claimedTotal}`);
		}
		console.log(
			`Total supply: ${supply} W, Unclaimed: ${bonusPool}.W, ${(
				(100 * bonusPool) /
				supply
			).toFixed(3)}%`
		);
	},

	getTweetText: async (userId) => {
		const tweet = await ctx.api.TwitterOracle.getTweetText(userId);
		if (!utils.nonEmptyString(tweet)) {
			console.log('None found.');
			return;
		}
		console.dir(tweet);
		return;
	},

	findClaimTweet: async (userId) => {
		const r = await ctx.twitterDomain.findClaimTweet(userId);
		console.log({ r });
	},

	getLodgedTweets: async (userId) => {
		const events = await ctx.api.TwitterOracle.getLodgedTweets(userId);
		if (!(events && events.length)) {
			console.log('None found.');
			return;
		}
		const users = ctx.twitterUsers;
		await fetchUserHandles(users)(events.map((e) => e.returnValues.userId));

		const eventList = events.map((e) => ({
			blockNumber: e.blockNumber,
			returnValues: e.returnValues,
			summary: `${e.blockNumber.toString().padStart(10)}: @${printHandle(
				users.users[e.returnValues.userId].handle
			)} ${printId(e.returnValues.userId)} ${printId(e.returnValues.queryId)}`,
		}));

		console.log(
			`${'Block'.padStart(10)}   ${printHandle('Handle')} ${printId('userId')} ${printId(
				'queryId'
			)}`
		);
		eventList.forEach((e) => console.log(e.summary));
		console.log('\nTotal lodged: ', eventList.length);
		return;
	},

	getUser: async (userId) => {
		const users = await ctx.api.UserRegistry.getUsers(userId);
		if (!users) {
			console.log('None found.');
			return;
		}

		await fetchUserHandles(ctx.twitterUsers)(users.map((u) => u.userId));
		console.log(
			`${''.padStart(4)}${printId('Handle')}${printId('ID')}${printAmount(
				'Balance'
			)}${printFollowers('Followers')}\t${'Address'}`
		);
		users.forEach((u, i) =>
			console.log(
				`${i.toString().padStart(3)}:${printId(
					ctx.twitterUsers.users[u.userId].handle
				)}${printId(u.userId)}${printAmount(u.balance)}W ${printFollowers(
					ctx.twitterUsers.users[u.userId].followers_count
				)}\t${u.account}`
			)
		);
		return;
	},

	getClaimedEvents: async (userId) => {
		const events = await ctx.api.UserRegistry.getClaimedEvents();
		if (!(events && events.length)) {
			console.log('None found.');
			return;
		}

		const users = ctx.twitterUsers;
		await fetchUserHandles(users)(events.map((e) => e.returnValues.userId));

		const eventList = events.map((e) => ({
			blockNumber: e.blockNumber,
			returnValues: e.returnValues,
			summary: `${e.blockNumber}:\t@${printHandle(
				users.users[e.returnValues.userId].handle
			)}, f:${printFollowers(
				users.users[e.returnValues.userId].followers_count
			)} claimed ${e.returnValues.amount}.W with minting bonus @${e.returnValues.bonus}`,
		}));
		eventList.forEach((e) => console.log(e.summary));
		console.log('\nTotal claims: ', eventList.length);

		return;
	},

	getBonusEvents: async (claimer, referrer) => {
		const events = await ctx.api.UserRegistry.getTributeBonuses(claimer, referrer);
		if (!(events && events.length)) {
			console.log('None found.');
			return;
		}

		const users = ctx.twitterUsers;
		await fetchUserHandles(users)(
			events
				.map((e) => e.returnValues.referrerId)
				.concat(events.map((e) => e.returnValues.claimerId))
		);

		const eventList = events.map((e) => ({
			blockNumber: e.blockNumber,
			returnValues: e.returnValues,
			summary: `${e.blockNumber}:\t@${users.users[e.returnValues.referrerId]} received ${
				e.returnValues.amount
			}.W for referring @${users.users[e.returnValues.claimerId]}`,
		}));
		eventList.forEach((e) => console.log(e.summary));
		console.log('\nTotal bounty rewards: ', eventList.length);

		return;
	},

	getTransferEvents: async (from, to) => {
		const events = await ctx.api.UserRegistry.getTransferEvents(from, to);
		if (!(events && events.length)) {
			console.log('None found.');
			return;
		}

		const userIds = [];
		events.forEach((e) => {
			userIds.push(e.returnValues.toId);
			userIds.push(e.returnValues.fromId);
		});
		const users = ctx.twitterUsers;
		await fetchUserHandles(users)(userIds);

		const eventList = events.map((e) => ({
			blockNumber: e.blockNumber,
			returnValues: e.returnValues,
			summary: `${e.blockNumber}:\t@${printHandle(
				users.users[e.returnValues.fromId].handle
			)} sent ${e.returnValues.amount}.W to ${
				e.returnValues.claimed ? 'claimed' : 'unclaimed'
			} user @${printHandle(users.users[e.returnValues.toId].handle)}`,
		}));

		eventList.forEach((e) => console.log(e.summary));
		console.log('\nTotal transfers: ', eventList.length);
		return;
	},
});

const bindCommands = () => initContext().then(Commands);

module.exports = bindCommands;
