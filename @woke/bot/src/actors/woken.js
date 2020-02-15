// Keep track of unsent tips

const statuses = [
	'UNSETTLED',
	'SETTLED',
	'FAILED',
	'INVALID',
];
const statusEnum = {};
statuses.forEach((s, i) => statusEnum[s] = i);

const delay = ms => new Promise(res => setTimeout(res, ms));
const resetWithExponentialDelay = (factor) => {
	let count = 0;
	return async (msg, error, ctx) => {
		let delay = (2**count - 1)*factor;
		await delay(delay);
		++count;
		return ctx.reset;
	};
}

const CONTRACT_TIMEOUT = 300;

const tipActor = {
	properties: {
		initialState: {
			tip,
			status,
		},

	},

	actions: {
	}
}

const tipper = {
	properties: {
		initialState: {
			tipRepo: {},
			wokenContract: null,
		},

		onCrash: (() => {
			reset = resetWithExponentialDelay(1)
			return (msg, error, ctx) => {
				switch(msg.type) {
					case 'tip': {
					}

					default: {
						return reset(msg, error, ctx);
					}
				}
			}
		})(),
	},

	actions: {
		'tip': async (msg, ctx, state) => {
			const { tipRepo, wokenContract } = state;
			const { tip } = msg;

			let entry = tipRepo[tip.id];
			if(!entry) {
				// New tip
				entry = {
					status: statusEnum.UNSETTLED,
					error: null,
				}

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
