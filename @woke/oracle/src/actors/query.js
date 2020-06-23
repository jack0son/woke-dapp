const { ActorSystem, receivers, reducers, actors: { SinkAdapter } } = require('@woke/wact');
const { dispatch } = ActorSystem;
const { subsumeReduce, Pattern } = reducers;
const { tweetToProofString } = require('../lib/proof-protcol');


function fetchProofTweet(msg, ctx, state) {
	const { a_twitterAgent, job: { userId }} = state;
	ctx.debug.d(msg, `Fetching twitter data for user ${userId}`);
	dispatch(a_twitterAgent,  { type: 'find_proof_tweet', userId }, ctx.self);
}

function handleFailure(msg, ctx, state) {
	const { error } = state;
	if(error) {
		// Catch error in on crash, schedule new attempt
		if(error.message.includes('not found') || error.message.includes('No tweets found')) {
			ctx.receivers.update_job({ status: 'failed' }, error);
			return ctx.stop;
		}
		throw error;
	}
	return state;
}

function handleTwitterResponse(msg, ctx, state) {
	const { action, user, error } = msg;
	switch(action) {
		case 'find_proof_tweet': {
			return handleProofTweet(msg, ctx, state);
		}
		default: {
			ctx.debug.d(msg, `No handler defined for response to ${action}`);
			return state;
		}
	}
}

function handleProofTweet(msg, ctx, state) {
	const { userId, tweet, userData, error } = msg;

	if(error) {
		return { ...state, error };
	}

	if(!userId == state.userId) throw new Error(`Query received user data for incorrect user ${userId}, expected ${state.userId}`);

	return { ...state, tweet, userData }; 
}

function submitQueryTx(msg, ctx, state) {
	ctx.debug.d(msg, 'Submitting query response transaction');
	const { job, a_contract_TwitterOracle, tweet, userData } = state;

	const proofString = tweetToProofString(tweet, userData);
	dispatch(a_contract_TwitterOracle, { type: 'send', 
		method: '__callback',
		args: [job.queryId, proofString, '0x0'],
		sinks: [ctx.self],
	}, ctx.self);

	return {...state, txSent: true };
}

// Add tx data to state
function handleQueryTx(msg, ctx, state) {
	const { error, tx, status } = msg;
	if(tx.method == '__callback') {
		return  { ...state, responseTx: { error, tx, status }};
	}
}

function handleQueryFailure(msg, ctx, state) {
	ctx.debug.d(msg, 'Query failed');
	const { job: { queryId }, userId, txResponse } = state;
	ctx.receivers.update_job({ status: 'failed' }, txResponse.error);
	return ctx.stop;
}

function complete(msg, ctx, state) {
	const { job: { queryId, userId }, responseTx } = state;
	ctx.debug.d(msg, `Query complete`);
	ctx.receivers.update_job({
		queryId,
		userId,
		status: 'settled',
		txHash: responseTx.txHash,
	});

	return ctx.stop;
}

function haveTwitterData(state) {
	return !!state.userData && !!state.tweet;
}

const init = Pattern(
	(state) => !haveTwitterData(state),	// predicate
	fetchProofTweet											// effect
);

const failed = Pattern(
	({ error }) => !!error,	// predicate
	handleFailure,
);

const submitQuery = Pattern(
	({responseTx, ...state }) => haveTwitterData(state) && !responseTx,
	submitQueryTx
);

const queryComplete = Pattern(
	({responseTx, ...state}) => haveTwitterData(state) && !!responseTx && !!responseTx.tx.receipt,
	complete
);

const queryFailed = Pattern(
	({responseTx, ...state}) => haveTwitterData(state) && !!responseTx && !!responseTx.error,
	handleQueryFailure
);

const patterns = [init, submitQuery, queryFailed, queryComplete, failed];
const reducer = reducers.subsumeReduce(patterns);

//function QueryJob(a_twitterAgent, a_contract_TwitterOracle) {
module.exports = {
		properties: {
			initialState: {
				userId: null,
				a_contract_TwitterOracle: null,
				a_twitterAgent: null,
				sinkHandlers: {
					twitterAgent: handleTwitterResponse, 
					tx: handleQueryTx,
				},
				kind: 'queryJob',
			},

			receivers: ({msg, ctx, state}) => ({
				sink: receivers.sink({msg, ctx, state}),
				update_job: (job, error) => {
					const { job: { queryId }, userId } = state;
					dispatch(ctx.parent, { type: 'update_job',
						job: { queryId, userId, ...job },
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
//module.exports = QueryJob;
