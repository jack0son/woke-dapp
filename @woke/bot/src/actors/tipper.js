// Keep track of unsent tips
const { dispatch, query } = require('nact');
const { start_actor } = require('../actor-system');
const tipActor = require('./tip');
const { delay, tip_str } = require('../lib/utils');


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

const tipper = {
	statusEnum,

	properties: {
		initialState: {
			tipRepo: {},
			a_wokenContract: null,
		},

		onCrash: (() => {
			reset = resetWithExponentialDelay(1)
			return (msg, error, ctx) => {
				console.log('CASH --- ', ctx.name);
				console.log(msg);
				switch(msg.type) {
					case 'tip': {
					}

					default: {
						return reset(msg, error, ctx);
					}
				}
			}
		})(),
		onCrash: undefined,
	},

	actions: {
		'tip': async (msg, ctx, state) => {
			const { tipRepo, a_wokenContract } = state;
			const { tip } = msg;

			if(!a_wokenContract) {
				ctx.debug.error(msg, 'Must have reference to wokenContract actor');
				throw new Error(`Must have reference to wokenContract actor`);
			}

			//ctx.debug.info(msg, `Received tip ${tip.id}`);
			//ctx.debug.d(msg, tip_str(tip));
			console.log(tip_str(tip));
			let entry = tipRepo[tip.id];
			console.log(entry);

			if(!entry) {
				// New tip
				entry = {
					status: statusEnum.UNSETTLED,
					error: null,
				}

				ctx.debug.info(msg, `Spawning tip actor...`);
				const a_tip = spawn_tip(ctx.self, tip, a_wokenContract);

				dispatch(a_tip, { type: 'tip', tip }, ctx.self);

				entry.a_tip = a_tip;
				tipRepo[tip.id] = entry;
				return {
					...state,
					tipRepo: { ...tipRepo }
				}

			} else {
				ctx.debug.d(msg, `Got existing tip ${tip.id}`);
				// Existing tip
				switch(entry.status) {
					case statusEnum.UNSETTLED: {
					}
				}
			}
		},

		'tip_update': (msg, ctx, state) => {
			const { tipRepo, wokenContract } = state;
			const { tip, status, error} = msg;

			console.log(tip);
			if(tip.error) {
				ctx.debug.error(msg, `Tip ${tip.id} from ${tip.fromHandle} error: ${tip.error}`)
			}
			ctx.debug.d(msg, `Updated tip:${tip.id} to ⊰ ${tip.status} ⊱`)

			if(tip.status === 'SETTLED') {
				console.log(`\n@${tip.fromHandle} tipped @${tip.toHandle} ${tip.amount} WOKENS\n`)
			}

			tipRepo[tip.id] = {
				...tipRepo[tip.id],
				...tip,
				//status,
				//error,
			}

			return {
				...tipRepo
			};
		},

		'distribute': (msg, ctx, state) => {
			// Each new user joining adds to the distro pool
			// Pool gets distributed every x periods 
		}
	}
}

module.exports = tipper;
