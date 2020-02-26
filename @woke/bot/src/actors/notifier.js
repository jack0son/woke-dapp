// Subscribe to blockchain logs and notify users on twitter
// Manages notifications in a transactional fashion
const { start_actor, block } = require('../actor-system');
const { spawnStateless, dispatch } = require('nact');

const states = [
	'SETTLED',	// notification sent
	'UNSETTLED',// waiting for notifiaction to send
	'FAILED',		// could not post notification
];

// Temporary actor to wait for twitter requests to complete
let idx = 0;
const spawn_tweet_promise = (log, _ctx) => {
	return spawnStateless(_ctx.self, 
		(msg, ctx) => {
			const {type, tweet} = msg;
			if(type == 'tweet_unclaimed_transfer') {
				if(tweet) {
					dispatch(_ctx.self, { type: 'update_log', log: {...log, status: 'SETTLED', statusId: tweet.id_str }}, ctx.self);
				} else {
					dispatch(_ctx.self, { type: 'update_log', log: {...log, status: 'FAILED' }}, ctx.self);
				}
			}
		},
		`tweet_promise-${idx++}`,
	);
}

const notifier = {
	properties: {
		persistenceKey: 'notifier', // only ever 1, static key OK

		initialState: {
			a_wokenContract: null,
			a_tweeter: null,
			logRepo: {},
		},
	},

	actions: {
		'init': async (msg, ctx, state) => {
			const { a_wokenContract } = state;

			// Subscribe to unclaimed transfers

			// Rely on subscription to submit logs from block 0
			// @TODO persist last seen block number
			let response = await block(a_wokenContract, {
				type: 'subscribe_log',
				eventName: 'Tx',
				opts: { fromBlock: 0 },
				filter: e => e.claimed == false,
			});
			const a_unclaimed_tx_sub = response.a_sub;

			dispatch(a_unclaimed_tx_sub,  {type: 'start'}, ctx.self);
		},

		// -- Source actions
		'unclaimed_tx': (msg, ctx, state) => {
			const { logRepo, a_tweeter } = state;
			const { log } = msg;

			//console.log(msg);

			let entry = logRepo[log.transactionHash];
			if(!entry) {
				entry = { status: 'UNSETTLED' };
			}

			switch(entry.status) {
				case 'UNSETTLED': {
					ctx.debug.info(msg, `Settling ${log.transactionHash}...`);
					const a_promise = spawn_tweet_promise(log, ctx);
					entry.toId = log.event.toId;
					entry.fromId = log.event.fromId;
					entry.amount = log.event.amount;

					dispatch(a_tweeter, { type: 'tweet_unclaimed_transfer',
						toId: entry.toId,
						fromId: entry.fromId,
						amount: entry.amount,
					}, a_promise);
					break;
				}

				case 'SETTLED': {
					ctx.debug.info(msg, `Already notified unclaimed transfer ${log.transactionHash}.`);
				}

				default: {
					break;
				}
			}

			return { ...state, logRepo: { ...logRepo, [log.transactionHash]: entry } };
		},

		'update_log': async (msg, ctx, state) => {
			const { log, status} = msg;
			const { logRepo } = state;
			const entry = logRepo[log.transactionHash];

			const console_log = (...args) => { if(!ctx.recovering) console.log(...args) }

			if(ctx.persist && !ctx.recovering) {
				await ctx.persist(msg);
			}

			ctx.debug.d(msg, `Updated log:${log.transactionHash} to ⊰ ${log.status} ⊱`)

			if(log.status == 'SETTLED') {
				console_log(`\nNotified: @${entry.fromId} sent @${entry.toId} ${entry.amount} WOKENS\n`)
			}

			return {
				...state,
				logRepo: {
					...logRepo,
					[log.transactionHash]: { ...entry, status },
				}
			}
		},

		// -- Sink actions
		'a_sub': (msg, ctx, state) => {
			const { eventName } = msg;
			switch(eventName) {
				case 'Tx': {
					dispatch(ctx.self, { ...msg, type: 'unclaimed_tx' }, ctx.self);
					break;
				}

				default: {
					ctx.debug.info(msg, `No action defined for subscription to '${eventName}' events`);
				}
			}
		},

		'a_tweeter': (msg, ctx, state) => {
			const { eventName } = msg;
		}
	},
}

module.exports = notifier;
