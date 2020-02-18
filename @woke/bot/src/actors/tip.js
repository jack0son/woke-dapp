const { dispatch } = require('nact');
const { tip_str } = require('../lib/utils');

const properties = {
	initialState: {
		stage: 'INIT',
	},

	onCrash: undefined,
}

const eventsTable = {
	'start': {
		'INIT': {
			effect: (msg, ctx, state) => {
				const { tip } = state;
				//console.log(state);
				ctx.debug.d(msg, `Check @${tip.fromHandle} is claimed...`);
				dispatch(state.a_wokenContract, { type: 'call',
					method: 'userClaimed',
					args: [tip.fromId]
				}, ctx.self)

				return {...state, stage: 'calling-check_claim' }
			},
		},
	},

	'check_claim-recv': {
		'calling-check_claim': {
			effect: (msg, ctx, state) => {
				const { tip, a_wokenContract } = state;
				const { tx, result } = msg;
				let nextStage;
				const userIsClaimed = result;
				ctx.debug.d(msg, `userIsClaimed: ${userIsClaimed}`);
				if(userIsClaimed === false) {
					tip.status = 'INVALID';
					tip.error = 'unclaimed sender'
					//entry.status = statusEnum.INVALID;
					//entry.error = 'unclaimed sender'
					dispatch(ctx.parent, { type: 'tip_update', tip }, ctx.self);
					nextStage = 'invalid';

				} else if(userIsClaimed === true) {
					dispatch(a_wokenContract, {type: 'send', 
						method: 'tip',
						args: [tip.fromId, tip.toId, tip.amount],
						meta: {
							tip
						},
						sinks: ctx.self
					}, ctx.self)

					tip.status = 'UNSETTLED';
					nextStage = 'sending-tip';

				} else if(!userIsClaimed) {
					// Oh yes, this happens sometimes!
					throw new Error(`User unclaimed is ${userIsClaimed}`)
				}

				return {
					...state,
					stage: nextStage,
					tip,
				};
			}
		}
	},

	'send_tip-recv': {
		'sending-tip': {
			effect: (msg, ctx, state) => {
				const { tip } = state;
				const { txStatus, tx, txState } = msg;

				let nextStage;
				if(tx.meta.tip.id !== tip.id) {
					const errMsg = `${ctx.name} expects tip ${tip.id}, got ${tx.meta.tip.id}`;
					ctx.debug.error(msg, errMsg);
					throw new Error(errMsg);
				}

				ctx.debug.d(msg, `tip:${tip.id} Got tx update ${txStatus}`);
				switch(txStatus) {
					case 'success': {
						ctx.debug.d(msg, `tip:${tip.id} confirmed on chain`);
						tip.status = 'SETTLED';
						dispatch(ctx.parent, { type: 'tip_update', tip }, ctx.self);
						message.reduce({ event: 'settled' });

						return {
							...state,
							nextStage: 'settled',
						}
						break;
					}

					case 'error': {
						const errMsg = `tip:${tip.id} failed with error: ${txState.error}`;
						ctx.debug.error(errMsg);
						dispatch(ctx.self, {type: 'tip_update', status: statusEnum.FAILED});
						message.reduce({ event: 'send-tx-failed', error: errMsg });
						return {
							...state,
							nextStage: 'error',
						}
						break;
					}

					default: {
						ctx.debug.d(msg, `... do nothing`);
					}
				}
			}
		}
	},

	'settled': {
	},

	'error': {
	},
}

// Event reducer
function reduceEvent(msg, ctx, state) {
	const { stage } = state;
	const { event } = msg;

	ctx.debug.info(msg, `Got <${event}> in stage ╢${stage}╟`);
	const applicableStages = eventsTable[event];

	if(!applicableStages) {
		ctx.debug.d(msg, `No applicable stages for event <${event}>`);
		return state;
	}

	const action = applicableStages[stage];
	if(!action) {
		ctx.debug.d(msg, `No actions for event <${event}> in stage ╢${stage}╟`);
		return state;
	}

	// @fix
	const reduce = (_msg) => dispatch_reduce({ ...msg, ..._msg }, ctx);
	msg.reduce = reduce;

	const nextState = {...state, ...action.effect(msg, ctx, state)};
	return nextState;
}

// @TODO include in context as ctx.reduce
function dispatch_reduce(msg, ctx) {
	msg.type = 'reduce'
	dispatch(ctx.self, msg, ctx.self);
}

const actions = {
	// --- Source Actions
	'reduce': reduceEvent,

	'tip': (msg, ctx, state) => {
		const reduce = (_msg) => dispatch_reduce({ ...msg, ..._msg }, ctx);

		const { a_wokenContract } = state;
		const { tip } = msg;

		ctx.debug.d(msg, tip_str(tip));

		reduce({ event: 'start' });

		return {
			...state,
			stage: 'INIT',
			tip,
		}
	},

	// --- Sink Actions
	'tx': (msg, ctx, state) => {
		const reduce = (_msg) => dispatch_reduce({ ...msg, ..._msg }, ctx);

		const { tx } = msg;
		switch(tx.method) {
			case 'userClaimed': {
				reduce({ event: 'check_claim-recv'});
				break;
			}

			case 'tip': {
				reduce({ event: 'send_tip-recv',  ...msg});
				break;
			}

			default: {
				ctx.debug.warn(msg, `sink:tx: ${tx.method} has no sink action`)
				return;
			}
		}
	},
}

module.exports = {
	properties,
	actions,
}
