const { ActorSystem, receivers, reducers, actors: { SinkAdapter } } = require('@woke/wact');
const { dispatch } = ActorSystem;
const { subsumeReduce, Pattern } = reducers;

function handleFailure(msg, ctx, state) {
	const { error } = state;
	if(error) {
		// Catch error in on crash, schedule new attempt
		//if(error.message.includes('not found') || error.message.includes('No tweets found')) {
		//	ctx.receivers.update_job({ status: 'failed' }, error);
		//	return ctx.stop;
		//}
		throw error;
	}
	return state;
}

function submitFundTx(msg, ctx, state) {
	const { job: { address, fundAmount }, a_txManager } = state;
	if(!fundAmount || fundAmount <= 0) {
		throw new Error(`Invalid fund amount: ${fundAmount}`);
	}
	ctx.debug.d(msg, `Submitting funding transaction to ${address}`);


	ctx.receivers.update_job({ status: 'pending' });

	dispatch(a_txManager,{ type: 'send', 
		opts: { to: address, value: fundAmount },
	//	//sinks: [ctx.self],
	} , ctx.self);

	return {...state, txSent: true };
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
function handleFundTx(msg, ctx, state) {
	const { action, error, tx, status } = msg;

	if(action === 'send') {
		return  { ...state, txReply: { error, tx, status }};
	}
	return state;
}

// Problem with this pattern is that sink messages will not be commited to state 

function handleFundFailure(msg, ctx, state) {
	ctx.debug.d(msg, `Fund failed`);
	const { job: { userId }, txResponse } = state;
	throw txResponse.error;
//	ctx.receivers.update_job({ status: 'failed' }, txResponse.error);
	return ctx.stop;
}

function complete(msg, ctx, state) {
	const { job: { address, userId }, txReply } = state;
	// @TODO check correct jobId
	ctx.debug.d(msg, `Funding complete`);
	ctx.receivers.update_job({ status: 'settled',	txHash: txReply.txHash });

	return ctx.stop;
}


const start = Pattern(
	({ txReply, txSent }) => !txReply && !txSent,
	submitFundTx
);

const failed = Pattern(
	({ error }) => !!error,	// predicate
	handleFailure,
);

const jobComplete = Pattern(
	({ txReply }) => !!txReply && !!txReply.tx.receipt,
	complete
);

const txFailed = Pattern(
	//(state) => { console.log(state); },
	({ txReply }) => !!txReply && !!txReply.error,
	handleFundFailure,
);

const patterns = [start, failed, jobComplete, txFailed];
const reducer = subsumeReduce(patterns);

function onCrash(msg, error, ctx) {
	console.log(`Job ${ctx.name} crash`);
	error.actorName = ctx.name;
	return ctx.escalate;
}

//function FundJob(a_twitterAgent, a_contract_TwitterOracle) {
module.exports = {
		properties: {
			onCrash,
			initialState: {
				userId: null,
				sinkHandlers: {
					tx: handleFundTx,
				},
				kind: 'fundJob',
				txSent: false,
			},

			receivers: ({msg, ctx, state}) => ({
				sink: receivers.sink({msg, ctx, state}),
				update_job: (job, error) => {
					const { job: { userId, address } } = state;
					dispatch(ctx.parent, { type: 'update_job',
						job: { ...job, userId, address }, // keep spawned identifiers
						error
					}, ctx.self);
				}
			}),
		},
		actions: {
			...SinkAdapter(reducer),
			'start': reducer,
		}
}
