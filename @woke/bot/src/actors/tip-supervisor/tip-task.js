const {
	ActorSystem,
	reducers,
	adapters,
	actors: { TaskSupervisor },
} = require('@woke/wact');
const { dispatch } = ActorSystem;
const { Pattern } = reducers;
const {
	messageTemplates: {
		console: { tip_submitted },
	},
} = require('@woke/lib');

const { TaskStatuses: Statuses } = TaskSupervisor;

const exists = (prop) => prop !== undefined && prop !== null;

// Handle results from transaction actor
function sink_tx(state, msg, ctx) {
	const { results, tip } = state;
	const { tx, txStatus, result, error } = msg;

	// Throw if contract calls fail
	if (error && tx.method !== 'tip') throw error;

	const newResults = {};
	switch (tx.method) {
		case 'userClaimed':
			newResults.userIsClaimed = result;
			break;

		case 'balanceOf':
			newResults.userBalance = parseInt(result);
			break;

		case 'tip':
			ctx.debug.info(msg, `tip:${tip.id} Got tx status ${txStatus}`);
			return { ...state, tipTx: { tx, txStatus, error } };

		default:
			throw new Error(`sink:tx: ${tx.method} has no sink action`);
	}

	return { ...state, results: { ...results, ...newResults } };
}

function effect_checkClaimStatus(state, msg, ctx) {
	const { tip, a_wokenContract } = state;
	ctx.debug.d(msg, `Check @${tip.fromHandle} is claimed...`);
	dispatch(
		a_wokenContract,
		{ type: 'call', method: 'userClaimed', args: [tip.fromId] },
		ctx.self
	);

	return state;
}

function effect_handleClaimStatus(state, msg, ctx) {
	const {
		results: { userIsClaimed },
		tip,
	} = state;
	ctx.debug.info(msg, `userIsClaimed: ${userIsClaimed}`);
	if (userIsClaimed === false) {
		tip.status = Statuses.invalid;
		tip.reason = 'unclaimed';
		ctx.receivers.update_tip(tip);
		return ctx.stop;
	} else if (userIsClaimed === true) {
		return checkUserBalance(state, msg, ctx);
	} else if (!userIsClaimed) {
		throw new Error(`User unclaimed is ${userIsClaimed}`);
	}

	return state;
}

function checkUserBalance(state, msg, ctx) {
	const { tip, a_wokenContract } = state;
	dispatch(
		a_wokenContract,
		{ type: 'call', method: 'balanceOf', args: [tip.fromId], sinks: [ctx.self] },
		ctx.self
	);
	return state;
}

function effect_handleUserBalance(state, msg, ctx) {
	const {
		results: { userBalance },
		tip,
		a_wokenContract,
	} = state;
	let nextStage;
	ctx.debug.d(msg, `@${tip.fromHandle}'s balance: ${userBalance}`);
	if (userBalance == 0) {
		tip.status = Statuses.invalid;
		tip.reason = 'broke';
		//entry.status = statusEnum.INVALID;
		//entry.error = 'unclaimed sender'
		ctx.receivers.update_tip(tip);
		nextStage = 'invalid';
	} else if (userBalance > 0) {
		ctx.debug.d(msg, `Sending tip from @${tip.fromHandle} ...`);
		dispatch(
			a_wokenContract,
			{
				type: 'send',
				method: 'tip',
				args: [tip.fromId, tip.toId, tip.amount],
				sinks: [ctx.self],
			},
			ctx.self
		);

		tip.status = Statuses.pending;
	} else if (!userBalance || userBalance == NaN) {
		// Oh yes, this happens sometimes!
		throw new Error(`Result from userBalance call ${userBalance}`);
	}

	return {
		...state,
		stage: nextStage,
		tip,
	};
}

function effect_handleTipSuccess(state, msg, ctx) {
	const {
		tipTx: { tx, txStatus, error },
		tip,
	} = state;
	const receipt = tx.receipt;
	ctx.debug.d(msg, `tip:${tip.id} confirmed on chain`);
	tip.tx_hash = receipt.transactionHash;

	if (!receipt.events.Tip) {
		// No Tip event emitted
		// Amount was 0, or attempted to tip existing user
		// Scenarios
		//		-- non zero tip amount
		//		-- zero tip balance

		const errMsg = `tip:${tip.id} returned 0 tip amount`;
		tip.error = errMsg;
		tip.status = Statuses.pending;
		//dispatch(ctx.parent, {type: 'update_tip', tip});
		//ctx.reduce({ event: 'settled', error: errMsg });

		//return ctx.stop;
		return { ...state, nextStage: 'FAILED', error: tip.error };
	}

	const tipEvent = receipt.events.Tip.returnValues;
	tip.amount = tipEvent.amount;

	// attach the tx hash so that the invite system can reply with a tweet
	if (tip.amount == 0) {
		tip.status = Statuses.failed;
	} else {
		tip.status = Statuses.done;
	}

	ctx.receivers.update_tip(tip);
	return ctx.stop;
}

function effect_handleTipFailure(state, msg, ctx) {
	const {
		tipTx: { txStatus, tx, error },
		tip,
	} = state;
	// For the moment, if web3 fails, the tip just fails
	const errMsg = `tip:${tip.id} failed with error: ${error}`;
	ctx.debug.error(msg, errMsg);
	tip.error = errMsg;
	tip.status = Statuses.failed;
	ctx.receivers.update_tip(tip);

	return ctx.stop;
}

function effect_handleFailure(state, msg, ctx) {
	const { tip, error } = state;
	// For the moment, if web3 fails, the tip just fails
	const errMsg = `tip:${tip.id} failed with error: ${error}`;
	ctx.debug.error(msg, errMsg);
	tip.error = errMsg;
	tip.status = Statuses.failed;
	ctx.receivers.update_tip(tip);

	return ctx.stop;
}

const init = Pattern(
	//(state) => {
	//	//console.log('init:state', state);
	//	return !!state.tip && state.results.userIsClaimed === undefined;
	//},
	({ tip, results }) => !!tip && !exists(results.userIsClaimed),
	effect_checkClaimStatus
);

const gotClaimStatus = Pattern(
	({ tip, results }) =>
		!!tip && exists(results.userIsClaimed) && !exists(results.userBalance),
	effect_handleClaimStatus
);

const gotUserBalance = Pattern(
	({ tip, results, tipTx }) => !!tip && exists(results.userBalance) && !tipTx,
	effect_handleUserBalance
);

const tipTxSuccess = Pattern(
	({ tipTx }) => !!tipTx && tipTx.txStatus == 'success',
	effect_handleTipSuccess
);

const tipTxFailure = Pattern(
	({ tipTx }) => !!tipTx && tipTx.txStatus == 'error',
	effect_handleTipFailure
);

const failure = Pattern(({ error }) => !!error, effect_handleFailure);

const patterns = [
	init,
	gotClaimStatus,
	gotUserBalance,
	tipTxSuccess,
	tipTxFailure,
	failure,
];

const subsumptionReducer = reducers.subsumeEffects(patterns);
const reducer = (state, msg, ctx) => {
	// console.log('Reducer ctx.sender', ctx.sender.name);
	// console.log('Reducer msg: ', msg);
	return subsumptionReducer(state, msg, ctx);
};

function onCrash(msg, error, ctx) {
	console.log(`tipper:tip, name: ${ctx.name}`);
	error.actorName = ctx.name;
	return ctx.escalate;
}

// Reduce forwards a message to the reduce action
const reduce = ({ msg, ctx }) => (_msg) => {
	_msg.type = 'reduce';
	dispatch(ctx.self, { ...msg, ..._msg }, ctx.self);
};

const update_tip = ({ ctx, state }) => (tip) => {
	dispatch(ctx.parent, { type: 'update', task: { ...state.tip, ...tip } }, ctx.self);
};

module.exports = {
	properties: {
		onCrash,
		initialState: {
			results: {},
			sinkHandlers: {
				tx: sink_tx,
			},
		},

		receivers: [reduce, update_tip],
	},

	actions: {
		// --- Source Actions
		start: (state, msg, ctx) => {
			const { a_wokenContract } = state;
			const { tip } = msg;
			ctx.debug.d(msg, tip_submitted(tip));

			//console.log(state);

			dispatch(ctx.self, { type: 'reduce' }, ctx.sender);
			return { ...state, tip };
			//reducer({ ...state, tip }, msg, ctx);
		},

		reduce: reducer,

		// --- Sink Actions
		...adapters.SinkReduce(reducer),
	},
};
