const { ActorSystem: { dispatch } } = require('@woke/wact');
const { twitter: { tip_submitted } } = require('../lib/message-templates');

const properties = {
	initialState: {
		stage: 'INIT',
	},

	// Receivers are bound the message bundle and attached to the context
	receivers: (msg, state, ctx) => ({
		// Reduce forwards a message to the reduce action
		reduce: (_msg) => {
			_msg.type = 'reduce';
			dispatch(ctx.self, {...msg, ..._msg}, ctx.self);
		}
	}),

	onCrash: undefined,
}

// FSM engine. FSM table defined in events table.
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
		ctx.debug.warn(msg, `Event <${event}> triggers on actions in stage ╢ ${stage} ╟`);
		return state;
	}

	ctx.reduce = ctx.receivers.reduce; // convenience

	const nextState = {...state, ...action.effect(msg, ctx, state)};
	return nextState;
}

const actions = {
	// --- Internal
	'reduce': reduceEvent,

	// --- Source Actions
	'tip': (msg, ctx, state) => {
		const { a_wokenContract } = state;
		const { tip } = msg;

		ctx.debug.d(msg, tip_submitted(tip));

		ctx.receivers.reduce({ event: 'start' });

		return {
			...state,
			stage: 'INIT',
			tip,
		}
	},

	// --- Sink Actions
	'tx': (msg, ctx, state) => {
		const { tx, txStatus} = msg;

		switch(tx.method) {
			case 'userClaimed': {
				ctx.receivers.reduce({ event: 'check_claim-recv'});
				break;
			}

			case 'balanceOf': {
				ctx.receivers.reduce({ event: 'check_bal-recv'});
				break;
			}

			case 'tip': {
				ctx.receivers.reduce({ event: 'send_tip-recv',  ...msg});
				break;
			}

			default: {
				ctx.debug.warn(msg, `sink:tx: ${tx.method} has no sink action`)
				return;
			}
		}
	},
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
					tip.reason = 'unclaimed'
					//entry.status = statusEnum.INVALID;
					//entry.error = 'unclaimed sender'
					dispatch(ctx.parent, { type: 'tip_update', tip }, ctx.self);
					nextStage = 'invalid';

				} else if(userIsClaimed === true) {
					dispatch(a_wokenContract, {type: 'call', 
						method: 'balanceOf',
						args: [tip.fromId],
						sinks: [ctx.self],
					}, ctx.self)

					tip.status = 'UNSETTLED';
					nextStage = 'CALLING-CHECK-BALANCE';

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

	'check_bal-recv': {
		'CALLING-CHECK-BALANCE': {
			effect: (msg, ctx, state) => {
				const { tip, a_wokenContract } = state;
				const { tx, result } = msg;
				let nextStage;
				const balance = parseInt(result);
				ctx.debug.info(msg, `balance: ${balance}`);
				if(balance == 0) {
					tip.status = 'INVALID';
					tip.reason = 'broke'
					//entry.status = statusEnum.INVALID;
					//entry.error = 'unclaimed sender'
					dispatch(ctx.parent, { type: 'tip_update', tip }, ctx.self);
					nextStage = 'invalid';

				} else if(balance > 0) {
					dispatch(a_wokenContract, {type: 'send', 
						method: 'tip',
						args: [tip.fromId, tip.toId, tip.amount],
						sinks: [ctx.self],
					}, ctx.self)

					tip.status = 'UNSETTLED';
					nextStage = 'SENDING-TIP';

				} else if(!balance || balance == NaN) {
					// Oh yes, this happens sometimes!
					throw new Error(`Result from balance call ${balance}`)
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
				const { txStatus, tx, error } = msg;

				ctx.debug.info(msg, `tip:${tip.id} Got tx status ${txStatus}`);
				switch(txStatus) {
					case 'success': {
						const { tx: { receipt: receipt } } = msg;
						ctx.debug.d(msg, `tip:${tip.id} confirmed on chain`);
						tip.tx_hash = receipt.transactionHash;

						if(!receipt.events.Tip) {
							// No Tip event emitted
							// Amount was 0, or attempted to tip existing user
							// Scenarios
							//		-- non zero tip amount
							//		-- zero tip balance

							const errMsg = `tip:${tip.id} returned 0 tip amount`;
							tip.error = errMsg;
							tip.status = 'FAILED';
							dispatch(ctx.parent, {type: 'tip_update', tip});
							ctx.reduce({ event: 'settled', error: errMsg });

							return { ...state, nextStage: 'FAILED', }
						}

						const tipEvent = receipt.events.Tip.returnValues;
						tip.amount = tipEvent.amount;

						// attach the tx hash so that the invite system can reply with a tweet
						if(tip.amount == 0) {
							tip.status = 'FAILED';
						} else {
							tip.status = 'SETTLED';
						}

						dispatch(ctx.parent, { type: 'tip_update', tip }, ctx.self);
						ctx.reduce({ event: 'settled' });

						return { ...state, nextStage: 'CONFIRMED', }
						break;
					}

					case 'error': {
						// For the moment, if web3 fails, the tip just fails
						const errMsg = `tip:${tip.id} failed with error: ${error}`;
						ctx.debug.error(msg, errMsg);
						tip.error = errMsg;
						tip.status = 'FAILED'
						dispatch(ctx.parent, {type: 'tip_update', tip});
						ctx.reduce({ event: 'send-tx-failed', error: error});

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

module.exports = {
	properties,
	actions,
}
