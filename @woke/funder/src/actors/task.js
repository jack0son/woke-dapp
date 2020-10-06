const {
	ActorSystem,
	receivers,
	reducers,
	adapters,
	actors: { TaskSupervisor },
} = require('@woke/wact');
const { dispatch } = ActorSystem;
const { subsumeEffects, Pattern } = reducers;
const { TaskStatuses: Statuses } = TaskSupervisor;

function handleFailure(state, msg, ctx) {
	const { error } = state;
	if (error) {
		// Catch error in on crash, schedule new attempt
		//if(error.message.includes('not found') || error.message.includes('No tweets found')) {
		//	ctx.receivers.update_task({ status: 'failed' }, error);
		//	return ctx.stop;
		//}
		throw error;
	}
	return state;
}

function submitFundTx(state, msg, ctx) {
	const {
		task: { address, fundAmount },
		a_txManager,
	} = state;
	if (!fundAmount || fundAmount <= 0) {
		throw new Error(`Invalid fund amount: ${fundAmount}`);
	}
	ctx.debug.d(msg, `Submitting funding transaction to ${address}`);

	ctx.receivers.update_task({ status: Statuses.pending });

	dispatch(
		a_txManager,
		{
			type: 'send',
			opts: { to: address, value: fundAmount },
			//	//sinks: [ctx.self],
		},
		ctx.self
	);

	return { ...state, txSent: true };
}
/*
Tx manager reply:
 { type: 'sink',
  action: 'send',
  kind: 'tx',
  tx:
   { opts: { from: '0x21243b6b7c938EfE06d3129Fd816c3842Ac5640A' },
     type: 'send',
     nonce: 7,
     hash:
      '0x3cc8fa0fe30430737643a43bd4b2149a6760a7a40cd6b2dd07b84559e9691d2b' },
  error: undefined,
  txStatus: 'pending' }
*/

// Add tx data to state
function handleFundTx(state, msg, ctx) {
	const { action, error, tx, status } = msg;

	if (action === 'send') {
		return { ...state, txReply: { error, tx, status } };
	}
	return state;
}

// Problem with this pattern is that sink messages will not be commited to state

function handleFundFailure(state, msg, ctx) {
	ctx.debug.d(msg, `Fund failed`);
	const {
		task: { userId },
		txResponse,
	} = state;
	throw txResponse.error;
	//	ctx.receivers.update_task({ status: 'failed' }, txResponse.error);
	return ctx.stop;
}

function complete(state, msg, ctx) {
	const {
		task: { address, userId },
		txReply,
	} = state;
	// @TODO check correct taskId
	ctx.debug.d(msg, `Funding complete`);
	ctx.receivers.update_task({ status: Statuses.done, txHash: txReply.txHash });

	return ctx.stop;
}

const start = Pattern(({ txReply, txSent }) => !txReply && !txSent, submitFundTx);

const failed = Pattern(
	({ error }) => !!error, // predicate
	handleFailure
);

const taskComplete = Pattern(
	({ txReply }) => !!txReply && !!txReply.tx.receipt,
	complete
);

const txFailed = Pattern(
	//(state) => { console.log(state); },
	({ txReply }) => !!txReply && !!txReply.error,
	handleFundFailure
);

const patterns = [start, failed, taskComplete, txFailed];
const reducer = subsumeEffects(patterns);

function onCrash(msg, error, ctx) {
	console.log(`Task ${ctx.name} crash`);
	error.actorName = ctx.name;
	return ctx.escalate;
}

const update_task = ({ state, msg, ctx }) => (task, error) => {
	const {
		task: { userId, address },
	} = state;
	dispatch(
		ctx.parent,
		{
			type: 'update',
			task: { ...task, userId, address, error }, // keep spawned identifiers
		},
		ctx.self
	);
};

//function FundTask(a_twitterAgent, a_contract_TwitterOracle) {
module.exports = {
	properties: {
		onCrash,
		initialState: {
			userId: null,
			sinkHandlers: {
				tx: handleFundTx,
			},
			kind: 'fundTask',
			txSent: false,
		},

		receivers: [receivers.sink, update_task],
	},
	actions: {
		...adapters.SinkReduce(reducer),
		start: reducer,
	},
};
