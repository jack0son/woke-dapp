// Keep track of unsent tips
const { dispatch, query } = require('nact');
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

			const { tipRepo, a_wokenContract } = state;
			const { tip } = msg;

			if(!a_wokenContract) {
				ctx.debug.error(msg, 'Must have reference to wokenContract actor');
				throw new Error(`Must have reference to wokenContract actor`);
			}

			//ctx.debug.info(msg, `Received tip ${tip.id}`);
			ctx.debug.d(msg, tip_str(tip));
			let entry = tipRepo[tip.id];
			spawn_tip(
				{
					tip: {...entry}
				}
			)

			if(!entry) {
				// New tip
				entry = {
					status: statusEnum.UNSETTLED,
					error: null,
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

		'tx': (msg, ctx, state) => {
			const { txStatus, tx, txState } = msg;
			const tip = tx.meta.tip;
			ctx.debug.d(msg, msg);

			if(!meta.tip) {
				ctx.debug.error(msg, `Got unknown contract result, msg: ${msg}`)
				return;
			}
			ctx.debug.d(`tip:${tip.id} Got tx update ${txStatus}`);
			switch(txStatus) {
				case 'success': {
					ctx.debug.d(`tip:${tip.id} confirmed on chain`);
					dispatch(ctx.self, {type: 'tip_update', error, status: statusEnum.FAILED});
					break
				}

				case 'error': {
					ctx.debug.error(`tip:${tip.id} failed with error: ${txState.error}`);
					dispatch(ctx.self, {type: 'tip_update', status: statusEnum.FAILED});
					break;
				}

				default: {
					ctx.debug.d(`... do nothing`);
				}
			}
			return;
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
