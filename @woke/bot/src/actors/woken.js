// Keep track of unsent tips

const statuses = [
	'UNSETTLED',
	'SETTLED',
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

const tipper = {
	properties: {
		tipRepo: {},
		wokenContract: null,

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
		'tip': (msg, context, state) => {
			const { tipRepo, wokenContract } = state;
			const { tip } = msg;

			let entry = tipRepo[tip.id];
			if(!entry) {
				entry = {
					status: statusEnum.UNSETTLED,
					error: null,
				}

				const userIsClaimed = await query(a_wokenContract, { type: 'call',
					method: 'userIsClaimed',
					args: tip.fromId
				}, ctx.self)

				if(!userIsClaimed) {
					entry.status = statusEnum.INVALID;
					entry.error = 'unclaimed sender'

				} else {

					args = [tip.fromId, tip.toId, tip.amount];
					dispatch(wokenContract, {type: 'send', 
						method: 'tip',
						args: args,
					}, ctx.self)

					entry.status = statusEnum.UNSETTLED;
				}

				return {
					...state,
					tipRepo: { ...tipRepo }
				}

			} 
		},

		'tip_update': (msg, context, state) => {
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

		'distribute': (msg, context, state) => {
			// Each new user joining adds to the distro pool
			// Pool gets distributed every x periods 
		}
	}
}
