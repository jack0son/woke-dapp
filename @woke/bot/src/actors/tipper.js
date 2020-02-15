// Keep track of unsent tips
const { dispatch, query } = require('nact');
const { delay } = require('../lib/utils');
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

const CONTRACT_TIMEOUT = 300;

function tip_str(tip) {
	return `@${tip.fromHandle} wishes to tip @${tip.toHandle} ${tip.amount}.WOKENS`;
}

const tipActor = {
	properties: {
		initialState: {
			tip: null,
			status: 'init',
		},

		onCrash: async (msg, error, ctx) => {
		}
	},

	actions: {
	}
}

const tipper = {
	properties: {
		initialState: {
			tipRepo: {},
			a_wokenContract: null,
		},

		onCrash: (() => {
			reset = resetWithExponentialDelay(1)
			return (msg, error, ctx) => {
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
			ctx.debug.d(msg, tip_str(tip));
			let entry = tipRepo[tip.id];
			if(!entry) {
				// New tip
				entry = {
					status: statusEnum.UNSETTLED,
					error: null,
				}

				ctx.debug.d(msg, `Check @${tip.fromHandle} is claimed...`);
				const userIsClaimed = await query(a_wokenContract, { type: 'call',
					method: 'userIsClaimed',
					args: tip.fromId
				}, CONTRACT_TIMEOUT)

				if(!userIsClaimed) {
					entry.status = statusEnum.INVALID;
					entry.error = 'unclaimed sender'
				} else {

					args = [tip.fromId, tip.toId, tip.amount];
					dispatch(wokenContract, {type: 'send', 
						method: 'tip',
						args: args,
						meta: {
							tip
						}
					}, ctx.self)

					entry.status = statusEnum.UNSETTLED;
				}

				return {
					...state,
					tipRepo: { ...tipRepo }
				}

			} else {
				// Existing tip
				switch(entry.status) {
					case statusEnum.UNSETTLED: {
					}
				}
			}
		},

		'contract': (msg, ctx, state) => {
			const { result, error, meta } = msg;
			ctx.debug.d(msg, msg);

			if(!meta.tip) {
				ctx.debug.error(msg, `Got unknown contract result, msg: ${msg}`)
				return;
			}

			if(error) {
				// Error scenarios
				//	1. insufficient balance
				//	2. unclaimed user (should be caught before sending tip)

				dispatch(ctx.self, {type: 'tip_update', error, status: statusEnum.FAILED});
				return;
			}

			if(result.receipt) {
				dispatch(ctx.self, {type: 'tip_update', status: statusEnum.FAILED});
			}

		},

		'tip_update': (msg, ctx, state) => {
			const { tipRepo, wokenContract } = state;
			const { tip, status, error} = msg;

			tipRepo[tip.id] = {
				...tipRepo[tip.id],
				status,
				error,
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
