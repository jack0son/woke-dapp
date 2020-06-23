// Keep track of unsent tips
const { ActorSystem: { start_actor, dispatch, query } } = require('@woke/wact');
const { utils: { delay } } = require('@woke/lib');
const tipActor = require('./tip');
const { console: { tip_submitted } } = require('../lib/message-templates');

// Each tip is a simple linear state machine
const statuses = [
	'UNSETTLED',
	'SETTLED',
	'FAILED',
	'INVALID',
];
const statusEnum = {};
statuses.forEach((s, i) => statusEnum[s] = i);

const resetWithExponentialDelay = (factor) => {
	let count = 0;
	return async (msg, error, ctx) => {
		let ms = (2**count - 1)*factor;
		await delay(ms);
		++count;
		return ctx.reset;
	};
}

const resetWithMaxAttempts = (factor) => {
}

const AVG_BLOCK_TIME = 3*1000
const CONTRACT_TIMEOUT = 3*AVG_BLOCK_TIME;

function spawn_tip(_parent, tip, a_wokenContract) {
		return start_actor(_parent)(
			`_tip-${tip.id}`,
			tipActor,
			{
				a_wokenContract,
				tip,
			}
		);
}

// Send tip to WokeToken contract
// @returns tip actor
function settle_tip(msg, ctx, state) {
	ctx.debug.info(msg, `Spawning tip actor...`);
	const a_tip = spawn_tip(ctx.self, msg.tip, state.a_wokenContract);
	dispatch(a_tip, { type: 'tip', tip: msg.tip }, ctx.self);
	
	return a_tip;
}

const tipper = {
	statusEnum,

	properties: {
		persistenceKey: 'tipper', // only ever 1, static key OK

		initialState: {
			tipRepo: {},
			a_wokenContract: null,
			a_tweeter: null,
		},

		// HOF that makes various utility functions available to the
		// action handlers. Binds these functions to the current message context
		receivers: (msg, ctx, state) => ({
		}),

		// Like a receiver but guaranteed to behave like an action
		// i.e. it takes in msg, ctx, state and returns newState
		middleware: (msg, ctx, state) => {
		},

		onCrash: (() => {
			reset = resetWithExponentialDelay(1)
			return (msg, error, ctx) => {
				console.log('CRASH --- ', ctx.name);
				console.log(msg);
				switch(msg.type) {
					case 'tip': {
					}

					default: {
						return reset;
					}
				}
			}
		})(),
		onCrash: undefined,
	},

	// Message 'type' handlers
	actions: {
		'tip': async (msg, ctx, state) => {
			const { tipRepo, a_wokenContract } = state;
			const { tip } = msg;

			if(!a_wokenContract) {
				ctx.debug.error(msg, 'Must have reference to wokenContract actor');
				throw new Error(`Must have reference to wokenContract actor`);
			}
			let entry = tipRepo[tip.id];

			if(!entry) {
				// New tip
				console.log(tip_submitted(tip));
				console.log(`Tweet: ${tip.full_text}`);
				entry = {
					id: tip.id,
					status: statusEnum.UNSETTLED,
					error: null,
				}
				settle_tip(msg, ctx, state);

			} else {
				ctx.debug.d(msg, `Got existing tip ${tip.id}`);
				//console.log(entry);
				switch(entry.status) {
					case statusEnum.UNSETTLED: {
						console.log(`Settling existing tip ${tip_submitted(tip)}...`);
						// @TODO
						// Duplicate actor will crash tipper
						settle_tip(msg, ctx, state);
					}

					default: {
						return;
					}
				}
			}

			return { ...state, tipRepo: { ...tipRepo, [tip.id]: entry } }
		},

		// @TODO state not clearly encapsulated here
		//		-- is it tip or tipper that is responsible for tip.status?
		'tip_update': async (msg, ctx, state) => {
			const { tipRepo, wokenContract } = state;
			const { tip, status, error} = msg;

			const log = (...args) => { if(!ctx.recovering) console.log(...args) }

			if(ctx.persist && !ctx.recovering) {
				await ctx.persist(msg);
			}

			if(tip.error) {
				ctx.debug.error(msg, `Tip ${tip.id} from ${tip.fromHandle} error: ${tip.error}`)
			}
			ctx.debug.d(msg, `Updated tip:${tip.id} to ⊰ ${tip.status} ⊱`)

			// FSM effects
			if(!ctx.recovering) {
				switch(tip.status) {
					case 'SETTLED': {
						log(`\nTip settled: @${tip.fromHandle} tipped @${tip.toHandle} ${tip.amount} WOKENS\n`)
						dispatch(ctx.self, { type: 'notify', tip }, ctx.self);
						break;
					}

					case 'INVALID': {
						if(tip.reason) {
							//ctx.debug.error(msg, `Tip ${tip.id} from ${tip.fromHandle} error: ${tip.error}`)
							log(`\nTip invalid: ${tip.reason}`);
						}

						dispatch(ctx.self, { type: 'notify', tip }, ctx.self);
						break;
					}

					case 'FAILED': {
						if(tip.error) {
							//ctx.debug.error(msg, `Tip ${tip.id} from ${tip.fromHandle} error: ${tip.error}`)
							log(`\nTip failed: ${tip.error}`);
						}

						dispatch(ctx.self, { type: 'notify', tip }, ctx.self);
						break;
					}

					default: {
					}
				}
			}

			tipRepo[tip.id] = {
				...tipRepo[tip.id],
				...tip,
			}

			return { ...state, tipRepo }
		},

		'notify': (msg, ctx, state) => {
			const { a_tweeter } = state;
			const { tip } = msg;

			if(a_tweeter) {
				if(tip.status == 'SETTLED') {
					dispatch(a_tweeter, { type: 'tweet_tip_confirmed', tip })//, ctx.self);
				} else if (tip.status == 'INVALID') {
					dispatch(a_tweeter, { type: 'tweet_tip_invalid', tip })//, ctx.self);
				} else if (tip.status == 'FAILED') {
					dispatch(a_tweeter, { type: 'tweet_tip_failed', tip })//, ctx.self);
				}
			}
		},

		// Find unsettled tips and attempt to settle them
		'resume': (msg, ctx, state) => {
			const { tipRepo } = state;

			const unsettledIds = Object.keys(tipRepo)
				.filter(id => tipRepo[id].status == 'UNSETTLED');

			ctx.debug.d(msg, `Settling ${unsettledIds.length} unsettled tips...`);
			unsettledIds.forEach(id => {
				const tip = tipRepo[id];
				if(tip.status == 'UNSETTLED') {
					dispatch(ctx.self, { type: 'tip', tip }, ctx.self);
				}
			});

		},

		'distribute': (msg, ctx, state) => {
			// Each new user joining adds to the distro pool
			// Pool gets distributed every x periods 
		}
	}
}

module.exports = tipper;
