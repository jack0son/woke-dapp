const { tip_str } = require('utils');

const properties = {
	initialState: {
		stage: 'INIT',
	},

	onCrash: undefined,
}

// FSM will be map of actions states, states to actions or both

const template_eventsTable = {
	'a_event': {
		// action 1
		state_1: {
			effect: () => ()
			next: 'state_3'
		},

		// action 2
		state_2: {
		},
	}
}

const eventsTable = {
	'call-check_claim-start': {
		'init': {
			effect: (msg, ctx, state) => {
				const { tip } = state;
				ctx.debug.d(msg, `Check @${tip.fromHandle} is claimed...`);
				dispatch(state.a_wokenContract, { type: 'call',
					method: 'userClaimed',
					args: [tip.fromId]
				}, ctx.self)

				return {
					...state,
					stage: 'calling-check_claim',
				}
			},
			//next: 'calling-check_claim',
		},
	},

	'call-check_claim-recv': {
		'calling-check_claim': {
			effect: (msg, ctx, state) => {
				const { tip, a_wokenContract } = state;
				let nextStage;
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

	'send-tip-recv': {
		'sending-tip': {
			effect: (msg, ctx, state) => {
				const { tip } = state;
				const { txStatus, tx, txState } = msg;

				let nextStage;
				if(tx.meta.tip.id !== tip.id) {
					const errMsg = `${ctx.name} expects tip ${tip.id}, got ${tx.meta.tip.id}`;
					debug.ctx.error(msg, errMsg);
					throw new Error(errMsg);
				}

				ctx.debug.d(`tip:${tip.id} Got tx update ${txStatus}`);
				switch(txStatus) {
					case 'success': {
						ctx.debug.d(`tip:${tip.id} confirmed on chain`);
						tip.status = 'SETTLED';
						dispatch(ctx.parent, { type: 'tip_update', tip }, ctx.self);
						reduce({ event: 'settled' });

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
						reduce({ event: 'send-tx-failed', error: errMsg });
						return {
							...state,
							nextStage: 'error',
						}
						break;
					}

					default: {
						ctx.debug.d(`... do nothing`);
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

	const applicableStages = eventsTable[event];

	if(!applicableStages) {
		debug.ctx.d(`No applicable stages for event <${event}>`);
		return state;
	}

	const action = applicableStates[stage];
	if(!action) {
		debug.ctx.d(`No actions for event <${event}> in stage ╢${stage}╟`);
		return state;
	}

	const nextState = {...state, ...action.effect(msg, ctx, state)};
	return nextState;
}

function reduce(msg, ctx, state) {
	msg.type = 'reduce'
	dispatch(ctx.self, msg, ctx.self);
}

const actions = {
	// --- Source Actions
	'reduce': reduceEvent,

	'tip': async (msg, ctx, state) => {
		const { a_wokenContract } = state;
		const { tip } = msg;

		ctx.debug.d(msg, tip_str(tip));

	},

	// --- Sink Actions
	'tx': (msg, ctx, state) => {
		const { tx } = msg;
		switch(tx.method) {
			case 'userClaimed': {
				reduce({ event: 'call-check_claim-recv', userIsClaimed});
				break;
			}

			case 'tip': {
				reduce({ event: 'send-tip-recv',  ...msg});
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
