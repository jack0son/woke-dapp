const { ActorSystem, receivers, reducers, actors: { SinkAdapter } } = require('@woke/wact');
const { dispatch } = ActorSystem;
const { subsumeReduce, Pattern } = reducers;
const { tweetToProofString } = require('../lib/proof-protcol');

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
	ctx.debug.d(msg, 'Submitting funds transfer transaction');
	const { job: { address }, a_txManager } = state;

	dispatch(a_txManager, { type: 'send', 
		opts: { to: address },
		//sinks: [ctx.self],
	}, ctx.self);

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
	const { error, tx, status } = msg;
	if(tx.action == 'send') {
		return  { ...state, txReply: { error, tx, status }};
	}
}

function handleFundFailure(msg, ctx, state) {
	ctx.debug.d(msg, 'Fund failed');
	const { job: { queryId }, userId, txResponse } = state;
	ctx.receivers.update_job({ status: 'failed' }, txResponse.error);
	return ctx.stop;
}

function complete(msg, ctx, state) {
	const { job: { address, userId }, txReply } = state;
	// @TODO check correct jobId
	ctx.debug.d(msg, `Fund complete`);
	ctx.receivers.update_job({
		userId,
		status: 'settled',
		txHash: txReply.txHash,
	});

	return ctx.stop;
}

function haveTwitterData(state) {
	return !!state.userData && !!state.tweet;
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
	({ txReply }) => !!txReply && !!txReply.error,
	handleFundFailure
);

const patterns = [start, failed, jobComplete, txFailed];
const reducer = reducers.subsumeReduce(patterns);

//function FundJob(a_twitterAgent, a_contract_TwitterOracle) {
module.exports = {
		properties: {
			initialState: {
				userId: null,
				sinkHandlers: {
					tx: handleFundTx,
				},
				kind: 'fundJob',
			},

			receivers: ({msg, ctx, state}) => ({
				sink: receivers.sink({msg, ctx, state}),
				update_job: (job, error) => {
					const { job: { userId }, address } = state;
					dispatch(ctx.parent, { type: 'update_job',
						job: { queryId, address, ...job },
						error
					}, ctx.self);
				}
			}),

			onCrash: undefined,
		},
		actions: {
			...SinkAdapter(reducer),
			'start': reducer,
		}
}
