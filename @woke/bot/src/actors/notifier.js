// Subscribe to blockchain logs and notify users on twitter

const states = [
	'SETTLED',	// notification sent
	'UNSETTLED',// waiting for notifiaction to send
];

const spawn_tweet_promise = (log, _ctx) => {
	return spawnStateless(ctx.self, 
		(msg, ctx) => {
			const { success, tweet} = msg;
			if(type == 'tweet_unclaimed_transfer') {
				if(success) {
					dispatch(ctx.self, { type: 'log_update', log: {...log, stage: 'SETTLED', statusId: tweet.id_str }}, ctx.self);
				} else {
					dispatch(ctx.self, { type: 'log_update', log: {...log, stage: 'FAILED' }}, ctx.self);
				}
			}
		},
		'tweet_promise',
	);
}

const blockchainNotifer = {
	properties: {
		initialState: {
			a_wokenContract: null,
			a_tweeter: null,
			logRepo: {},
		},

		receivers: (msg, state, ctx) => ({
			reduce: (_msg) => {
				msg.type = 'reduce';
				dispatch(ctx.self, {...msg, ..._msg}, ctx.self);
			}
		}),
	},

	actions: {
		'init': async (msg, ctx, state) => {
			const { a_wokenContract } = state;

			// Subscribed to unclaimed transfers
			const a_unclaimed_tx_sub = await block(a_wokenContract, { type: 'subscribe_log', eventName, filter });
			dispatch(a_unclaimed_tx_sub,  {type: 'start'}, ctx.self);
		},

		'unclaimed_tx': (msg, ctx, state) => {
			const { a_tweeter } = state;
			const { log } = msg;
			const entry = logRepo[log.transactionHash];

			if(!entry) {
				entry = { stage: 'UNSETTLED' };
			}

			switch(entry.stage) {
				case 'UNSETTLED': {
					const a_promise = spawn_tweet_promise(log, ctx);
					dispatch(a_tweeter, { type: 'tweet',
						toId: log.event.toId,
						text: `Hey @toId, you have been sent ${log.event.amount} WOKENS by @fromId`,
					}, a_promise);
					break;
				}

				case 'SETTLED': {
					ctx.debug.info(`Already notified unclaimed transfer ${log.transactionHash}.`);
				}

				default: {
					break;
				}
			}

			return { ...state, logRepo: { ...logRepo, [log.transactionHash]: entry } };
		},

		'update_log': (msg, ctx, state) => {
			const { log, stage} = msg;
			const entry = logRepo[log.transactionHash];

			const console_log = (...args) => { if(!ctx.recovering) console.log(...args) }

			if(ctx.persist && !ctx.recovering) {
				await ctx.persist(msg);
			}

			return {
				...state,
				logRepo: {
					...logRepo,
					[log.transactionHash]: { ...entry, stage },
				}
			}
		},

		// -- Sink actions
		'a_sub': (msg, ctx, state) => {
			const { eventName } = msg;
			switch(eventName) {
				case 'Tx': {
					dispatch(ctx.self, { type: 'unclaimed_tx', ...msg}, ctx.self);
				}

				default: {
					ctx.debug.info(`No action defined for subscription to '${eventName}' events`);
				}
			}
		}
	},
}
