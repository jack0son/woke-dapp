const { ActorSystem, receivers, reducers, actors: { SinkAdapter } } = require('@woke/wact');
const { dispatch } = ActorSystem;
const { subsumeReduce, Pattern } = reducers;
const { tweetToProofString } = require('../lib/proof-protcol');


function fetchProofTweet(msg, ctx, state) {
	const { a_twitterAgent, job: { userId }} = state;
	ctx.debug.d(msg, `Fetching twitter data for user ${userId}`);
	dispatch(a_twitterAgent,  { type: 'find_proof_tweet', userId }, ctx.self);
}

function handleProofTweet(msg, ctx, state) {
	const { userId, tweet, userData, error } = msg;
	if(error) {
		// Catch error in on crash, schedule new attempt
		throw new Error(error);
	}
	if(!userId == state.userId) throw new Error(`Query received user data for incorrect user ${userId}, expected ${state.userId}`);

	return { ...state, tweet, userData }; 
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
	dispatch(ctx.parent, { type: 'update_job',
		job: {
			queryId,
			userId,
			status: 'failed'
		},
		error: txResponse.error,
	}, ctx.self);
}

function complete(msg, ctx, state) {
	const { job: { queryId, userId }, responseTx } = state;
	ctx.debug.d(msg, `${queryId}: Query complete`);
	dispatch(ctx.parent, { type: 'update_job',
		job: {
			queryId,
			userId,
			status: 'settled',
			txHash: responseTx.txHash,
		}
	}, ctx.self);

	return ctx.stop;
}

function haveTwitterData(state) {
	return !!state.userData && !!state.tweet;
}

const init = Pattern(
	(state) => !haveTwitterData(state),	// predicate
	fetchProofTweet											// effect
);

const submitQuery = Pattern(
	({responseTx, ...state }) => {
		return haveTwitterData(state) && !responseTx;
	},
	submitQueryTx
);

const queryComplete = Pattern(
	({responseTx, ...state}) => {
		return haveTwitterData(state) && !!responseTx && !!responseTx.tx.receipt;
	},
	complete
);

const queryFailed = Pattern(
	({responseTx, ...state}) => {
		return haveTwitterData(state) && !!responseTx && !!responseTx.error
	},
	handleQueryFailure
);

const patterns = [init, submitQuery, queryFailed, queryComplete];
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

			receivers: (bundle) => ({
				sink: receivers.sink(bundle),
			}),

			onCrash: undefined,
		},
		actions: {
			...SinkAdapter(reducer),
			'start': reducer,
		}
}
//module.exports = QueryJob;
