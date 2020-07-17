const { ActorSystem, receivers, reducers, actors: { SinkAdapter } } = require('@woke/wact');
const { dispatch } = ActorSystem;
const { subsumeReduce, Pattern } = reducers;
const { messageTemplates: { console: { tip_submitted } } } = require('@woke/lib');

// Handle results from transaction actor
function txSink(msg, ctx, state) {
	const { tx, txStatus} = msg;
	const { results, tip } = state;

	const newResults = {};
	switch(tx.method) {
		case 'userClaimed': {
			const { tx, result } = msg;
			newResults.userIsClaimed = result;
			//ctx.receivers.reduce({ event: 'check_claim-recv'});
			break;
		}

		case 'balanceOf': {
			const { tx, result } = msg;
			newResults.userBalance = parseInt(result);
			//ctx.receivers.reduce({ event: 'check_bal-recv'});
			break;
		}

		case 'tip': {
			const { txStatus, tx, error } = msg;
			ctx.debug.info(msg, `tip:${tip.id} Got tx status ${txStatus}`);
			return { ...state, tipTx: { tx, txStatus, error} }
		}

		default: {
			ctx.debug.warn(msg, `sink:tx: ${tx.method} has no sink action`)
			return;
		}
	}

	return { ...state, results: {...results, ...newResults} }
}

function effect_checkClaimStatus(msg, ctx, state) {
	const { tip } = state;
	ctx.debug.d(msg, `Check @${tip.fromHandle} is claimed...`);
	dispatch(state.a_wokenContract, { type: 'call',
		method: 'userClaimed',
		args: [tip.fromId]
	}, ctx.self)

	return state;
}

function effect_handleClaimStatus(msg, ctx, state) {
	const { results: { userIsClaimed }, tip } = state;
	ctx.debug.info(msg, `userIsClaimed: ${userIsClaimed}`);
	if(userIsClaimed === false) {
		tip.status = 'INVALID';
		tip.reason = 'unclaimed'
		//entry.status = statusEnum.INVALID;
		//entry.error = 'unclaimed sender'
		ctx.receivers.update_tip(tip);
		return ctx.stop;
	} else if(userIsClaimed === true) {
		//tip.status = 'UNSETTLED';
		nextStage = 'CALLING-CHECK-BALANCE';

		return effect_checkUserBalance(msg, ctx, state);
	} else if(!userIsClaimed) {
		// Oh yes, this happens sometimes!
		throw new Error(`User unclaimed is ${userIsClaimed}`)
	}

	return state;
}

function effect_checkUserBalance(msg, ctx, state) {
	const { tip, a_wokenContract } = state;
		dispatch(a_wokenContract, {type: 'call', 
			method: 'balanceOf',
			args: [tip.fromId],
			sinks: [ctx.self],
		}, ctx.self)

	return state;
}

function effect_handleUserBalance(msg, ctx, state) {
	const { results: { userBalance}, tip, a_wokenContract } = state;
	let nextStage;
	ctx.debug.info(msg, `userBalance: ${userBalance}`);
	if(userBalance == 0) {
		tip.status = 'INVALID';
		tip.reason = 'broke'
		//entry.status = statusEnum.INVALID;
		//entry.error = 'unclaimed sender'
		ctx.receivers.update_tip(tip);
		nextStage = 'invalid';
	} else if(userBalance > 0) {
		dispatch(a_wokenContract, {type: 'send', 
			method: 'tip',
			args: [tip.fromId, tip.toId, tip.amount],
			sinks: [ctx.self],
		}, ctx.self)

		tip.status = 'UNSETTLED';
		nextStage = 'SENDING-TIP';

	} else if(!userBalance || userBalance == NaN) {
		// Oh yes, this happens sometimes!
		throw new Error(`Result from userBalance call ${userBalance}`)
	}

	return {
		...state,
		stage: nextStage,
		tip,
	};
}

function effect_handleTipSuccess(msg, ctx, state) {
	const { tipTx: { tx, txStatus, error }, tip } = state;
	const receipt = tx.receipt;
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
		//dispatch(ctx.parent, {type: 'update_tip', tip});
		//ctx.reduce({ event: 'settled', error: errMsg });

		//return ctx.stop;
		return { ...state, nextStage: 'FAILED', error: tip.error }
	}

	const tipEvent = receipt.events.Tip.returnValues;
	tip.amount = tipEvent.amount;

	// attach the tx hash so that the invite system can reply with a tweet
	if(tip.amount == 0) {
		tip.status = 'FAILED';
	} else {
		tip.status = 'SETTLED';
	}

	ctx.receivers.update_tip(tip);
	return ctx.stop;
}

function effect_handleTipFailure(msg, ctx, state) {
	const { tipTx: { txStatus, tx, error }, tip } = state;
	// For the moment, if web3 fails, the tip just fails
	const errMsg = `tip:${tip.id} failed with error: ${error}`;
	ctx.debug.error(msg, errMsg);
	tip.error = errMsg;
	tip.status = 'FAILED'
	ctx.receivers.update_tip(tip);

	return ctx.stop;
}

function effect_handleFailure(msg, ctx, state) {
	const { tip, error } = state;
	// For the moment, if web3 fails, the tip just fails
	const errMsg = `tip:${tip.id} failed with error: ${error}`;
	ctx.debug.error(msg, errMsg);
	tip.error = errMsg;
	tip.status = 'FAILED'
	ctx.receivers.update_tip(tip);

	return ctx.stop;
}

const init = Pattern(
	({ tip, results }) => !!tip && results.userIsClaimed === undefined,
	effect_checkClaimStatus,
);

const gotClaimStatus = Pattern(
	({ tip, results}) => !!tip && results.userIsClaimed !== undefined && !results.userBalance,
	effect_handleClaimStatus,
);

const gotUserBalance = Pattern(
	({ tip, results, tipTx}) => !!tip && !!results.userBalance && !tipTx,
	effect_handleUserBalance,
);

const tipTxSuccess = Pattern(
	({ tipTx }) => !!tipTx && tipTx.txStatus == 'success',
	effect_handleTipSuccess,
);

const tipTxFailure = Pattern(
	({ tipTx }) => !!tipTx && tipTx.txStatus == 'error',
	effect_handleTipFailure,
);

const failure = Pattern(
	({ error }) => !!error,
	effect_handleFailure,
);

const patterns = [init, gotClaimStatus, gotUserBalance, tipTxSuccess, tipTxFailure, failure];
const reducer = reducers.subsumeReduce(patterns);

function onCrash(msg, error, ctx) {
	console.log(`tipper:tip, name: ${ctx.name}`);
	error.actorName = ctx.name;
	return ctx.escalate;
}

module.exports = {
	properties: {
		onCrash,
		initialState: {
			stage: 'INIT',
			results: {},
			sinkHandlers: {
				tx: txSink,
			}
		},

		// Receivers are bound the message bundle and attached to the context
		receivers: ({ msg, state, ctx }) => ({
			// Reduce forwards a message to the reduce action
			reduce: (_msg) => {
				_msg.type = 'reduce';
				dispatch(ctx.self, {...msg, ..._msg}, ctx.self);
			},
			update_tip: tip => {
				dispatch(ctx.parent, { type: 'update_tip',
					tip: { ...state.tip, ...tip },
				}, ctx.self);
			}
		}),
	},

	actions: {
		// --- Source Actions
		'tip': (msg, ctx, state) => {
			const { a_wokenContract } = state;
			const { tip } = msg;
			ctx.debug.d(msg, tip_submitted(tip));

			return reducer(msg, ctx, {
				...state,
				stage: 'INIT',
				tip,
			});
		},

		// --- Sink Actions
		...SinkAdapter(reducer),
	}
}
