// Subscribe to blockchain logs and notify users on twitter
// Manages notifications in a transactional fashion
const { ActorSystem, actors } = require('@woke/wact');
const { start_actor, dispatch, query, spawnStateless, block } = ActorSystem;

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
			const {type, tweet, error} = msg;
			if(error) {
				_ctx.debug.error(msg, `Promise from tweeter: ${error}`);
			}

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

function handleContractResponse(msg, ctx, state) {
	const { a_sub } = msg;
	// Once subscription received from contract, start the subscription
	if(a_sub) {
	}
	switch(msg.action) {
		case 'subscribe_log': {
			const { a_sub } = msg;
			// Once subscription received from contract, start the subscription
			if(a_sub) {
				const a_unclaimed_tx_sub = a_sub;
				dispatch(a_unclaimed_tx_sub,  {type: 'start'}, ctx.self);
				return { ...state, a_unclaimed_tx_sub };
			}
		}
		default: {
			ctx.debug.d(msg, `No handler defined for response to ${action}`);
		}
	}
}

function handleQuerySubscription(msg, ctx, state) {
	const { eventName } = msg;
	switch(eventName) {
		case 'Tx': {
			// Event update from subscription
			dispatch(ctx.self, { ...msg, type: 'unclaimed_tx' }, ctx.self);
			break;
		}

		default: {
			ctx.debug.info(msg, `No action defined for subscription to '${eventName}' events`);
		}
	}
}

function onCrash(msg, error, ctx) {
	console.log('Notifier crash');
	console.log(error);
	//console.log(ctx);
	const prefixString = `Notifier crashed`;
	dispatch(ctx.self, { type: 'monitor_notify', error, prefixString }, ctx.self);

	return ctx.resume;
}

function action_notify(msg, ctx, state) {
	const { a_monitor } = state;
	dispatch(a_monitor, { ...msg, type: 'notify' }, ctx.self);
}

const notifier = {
	properties: {
		persistenceKey: 'notifier', // only ever 1, static key OK
		onCrash,

		initialState: {
			a_contract_UserRegistry: null,
			a_tweeter: null,
			logRepo: {},
			sinkHandlers: {
				subscribe_log: handleQuerySubscription,
				a_contract: handleContractResponse,
			},
		},
	},

	actions: {
		...actors.SinkAdapter(),
		'init': (msg, ctx, state) => {
			const { a_contract_UserRegistry } = state;

			// Subscribe to unclaimed transfers

			// Rely on subscription to submit logs from block 0
			// @TODO persist last seen block number
			dispatch(a_contract_UserRegistry, {	type: 'subscribe_log',
				eventName: 'Tx',
				opts: { fromBlock: 0 },
				filter: e => e.claimed == false,
			}, ctx.self);
		},

		// -- Source actions
		'unclaimed_tx': async (msg, ctx, state) => {
			const { logRepo, a_tweeter, a_contract_UserRegistry } = state;
			const { log } = msg;

			//console.log(msg);

			let entry = logRepo[log.transactionHash];
			if(!entry) {
				entry = { status: 'UNSETTLED' };
			}

			switch(entry.status) {
				case 'UNSETTLED': {
					ctx.debug.info(msg, `Settling ${log.transactionHash} ...`);
					const a_promise = spawn_tweet_promise(log, ctx);
					entry.toId = log.event.toId;
					entry.fromId = log.event.fromId;
					entry.amount = log.event.amount;

					let balance;
					try {
						// Contract version incompatible (missing unclaimedBalance method)
						const balanceCall = await query(a_contract_UserRegistry, {type: 'call', 
							method: 'unclaimedBalanceOf',
							args: [entry.toId],
							sinks: [],
						}, 5*1000)
						balance = balanceCall.result;
					} catch(error) {
						ctx.debug.error(msg, 'call to wokenContract:unclaimedBalance() failed', error)
					}

					dispatch(a_tweeter, { type: 'tweet_unclaimed_transfer',
						toId: entry.toId,
						fromId: entry.fromId,
						amount: entry.amount,
						balance,
						i_want_the_error: a_promise, // ctx.sender not correct in onCrash on tweeter
					}, a_promise);
					console.log(`... got log @${entry.fromId} ==> @${entry.toId} : ${entry.amount}.W`)
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
				console_log(`\nNotified: @${log.event.fromId} sent @${log.event.toId} ${log.event.amount} WOKENS\n`)
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
		'a_sub': handleQuerySubscription,
		'a_tweeter_temp': (msg, ctx, state) => {
			const { eventName } = msg;
		},
		'monitor_notify': action_notify,
	},
}

module.exports = notifier;
