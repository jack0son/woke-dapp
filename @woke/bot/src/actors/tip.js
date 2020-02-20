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

				return {...state, stage: 'CALLING-CHECK_CLAIM' }
			},
		},
	},

	'check_claim-recv': {
		'CALLING-CHECK_CLAIM': {
			effect: (msg, ctx, state) => {
				const { tip, a_wokenContract } = state;
				const { tx, result } = msg;
				let nextStage;
				const userIsClaimed = result;
				ctx.debug.info(msg, `userIsClaimed: ${userIsClaimed}`);
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
						sinks: ctx.self
					}, ctx.self)

					tip.status = 'UNSETTLED';
					nextStage = 'SENDING-TIP';

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
		'SENDING-TIP': {
			effect: (msg, ctx, state) => {
				const { tip } = state;
				const { txStatus, tx, txState } = msg;

				ctx.debug.info(msg, `tip:${tip.id} Got tx status ${txStatus}`);
				switch(txStatus) {
					case 'success': {
						// Scenarios
						//		-- non zero tip amount
						//		-- zero tip balance

						// Extract transaction receipt
						ctx.debug.d(msg, `tip:${tip.id} confirmed on chain`);
						tip.status = 'SETTLED';
						const { receipt } = msg;
						if(!receipt.events.Tip) {
							// No Tip event emitted
							// Amount was 0, or attempted to tip existing user
							const errMsg = `tip:${tip.id} returned 0 tip amount`;
							tip.error = errMsg;
							tip.status = 'FAILED';
							dispatch(ctx.parent, {type: 'tip_update', tip});
							ctx.reduce({ event: 'settled', error: errMsg });

							return { ...state, nextStage: 'FAILED', }
						}

						const tipEvent = receipt.events.Tip.returnValues;
						tip.amount = tipEvent.amount;

						if(tip.amount == 0) {
						}
						console.log();

						dispatch(ctx.parent, { type: 'tip_update', tip }, ctx.self);
						ctx.reduce({ event: 'settled' });
						nextState = 'CONFIRMED';

						return { ...state, nextStage: 'CONFIRMED', }
						break;
					}

					case 'error': {
						// For the moment, if web3 fails, the tip just fails
						const errMsg = `tip:${tip.id} failed with error: ${txState.error}`;
						ctx.debug.error(errMsg);
						tip.error = errMsg;
						tip.status = 'FAILED'
						dispatch(ctx.parent, {type: 'tip_update', tip});
						ctx.reduce({ event: 'send-tx-failed', error: txState.error});

						return { ...state, nextStage: 'FAILED', }
						break;
					}

					default: {
						// Other tx status
						//ctx.debug.info(msg, `... do nothing`);
					}
				}

			}
		}
	},

	'settled': {
		'CONFIRMED': {
			effect: (msg, ctx, state) => {
				return ctx.stop();
			}
		},

		'FAILED': {
			effect: (msg, ctx, state) => {
				return ctx.stop();
			},
		}
	},

	'error': {
		'FAILED': {
			effect: (msg, ctx, state) => {
				return ctx.stop();
			}
		}
	},
}

// Event reducer
function reduceEvent(msg, ctx, state) {
	const { stage } = state;
	const { event } = msg;

	ctx.debug.info(msg, `Got <${event}> in stage ╢ ${stage} ╟`);
	const applicableStages = eventsTable[event];

	if(!applicableStages) {
		ctx.debug.warn(msg, `No applicable stages for event <${event}>`);
		return state;
	}

	const action = applicableStages[stage];
	if(!action) {
		ctx.debug.warn(msg, `No actions for event <${event}> in stage ╢ ${stage} ╟`);
		return state;
	}

	// @fix reduce sh
	const reduce = (_msg) => dispatch_reduce({ ...msg, ..._msg }, ctx);
	ctx.reduce = reduce;

	const nextState = {...state, ...action.effect(msg, ctx, state)};
	return nextState;
}

// @TODO include in context as ctx.reduce
function dispatch_reduce(msg, ctx) {
	msg.type = 'reduce'
	dispatch(ctx.self, msg, ctx.self);
}

// @
const middleware = (msg, ctx, state) => {
	// Attach reduce function
}

const actions = {
	// --- Internal
	'reduce': reduceEvent,

	// --- Source Actions
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
