const { ActorSystem, receivers, reducers, actors: { SinkAdapter } } = require('@woke/wact');
const { dispatch } = ActorSystem;
const { subsumeReduce, Pattern } = reducers;
const { tweetToProofString } = require('../lib/proof-protcol');


function fetchProofTweet(msg, ctx, state) {
	debug.d(msg, 'Fetching twitter data');
	const { a_twitterAgent, userId } = state;
	dispatch(a_twitterAgent,  { type: 'find_proof_tweet', userId }, ctx.self);
}

function handleProofTweet(msg, ctx, state) {
	const { userId, tweet, userData } = msg;
	if(!userId == state.userId) throw new Error(`Query received user data for incorrect user ${userId}, expected ${state.userId}`);

	return { ...state, tweet, userData }; 
}

function handleTwitterResponse(msg, ctx, state) {
	const { action, user, error } = msg;
	switch(action) {
		case find_proof_tweet: {
			return handleProofTweet(msg, ctx, state);
		}
		default: {
			debug.d(msg, `No handler defined for response to ${action}`);
			return state;
		}
	}
}

function submitQueryTx(msg, ctx, state) {
	debug.d(msg, 'Submitting query response transaction');
	const { query, a_contract_TwitterOracle, tweet, userData } = state;

	const proofString = tweetToProofString(tweet, userData);
	dispatch(a_contract_TwitterOracle, {type: 'send', 
		method: '__callback',
		args: [quer.queryId, proofString, '0x0'],
		sinks: [ctx.self],
	}, ctx.self);

	return {...state, txSent: true };
}

function complete(msg, ctx, state) {
	const { queryId, userId, responseTx } = state;
	debug.d(msg, `${queryId}: Query complete`);
	dispatch(ctx.parent, { type: 'update_job',
		queryId,
		userId,
		status: 'settled',
		txHash: responseTx.txHash,
	}, ctx.self);

	return ctx.stop;
}

function handleQueryFailure(msg, ctx, state) {
	debug.d(msg, 'Query failed');
	const { queryId, userId } = state;
	dispatch(ctx.parent, { type: 'update_query', queryId, userId, status: 'failed' }, ctx.self);
}

const init = Pattern(
	({twitterData}) => {
		return !twitterData;
	},
	fetchProofTweet
);

const submitQuery = Pattern(
	({twitterData, queryReceipt}) => {
		return !!twitterData && !queryReceipt;
	},
	submitQueryTx
);

const queryComplete = Pattern(
	({twitterData, responseTx}) => {
		return !!twitterData && !!responseTx && !!responseTx.receipt;
	},
	complete
);

const queryFailed = Pattern(
	({responseTx}) => {
		return !!twitterData && !!responseTx && !!responseTx.error
	},
	handleQueryFailure
);

const patterns = [init, submitQuery, queryFailed, queryComplete];
const reducer = reducers.subsumeReduce(patterns);

// Add tx data to state
function handleQueryTx(msg, ctx, state) {
	const { error, tx, status } = msg;
	if(tx.method == '__callback') {
		return  { ...state, responseTx: { error, tx, status }};
	}
}

//function QueryJob(a_twitterAgent, a_contract_TwitterOracle) {
module.exports = {
		properties: {
			initialState: {
				userId: null,
				a_contract_TwitterOracle: null,
				a_twitterAgent: null,
				sinkHandlers: {
					twitter: handleTwitterResponse, 
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
		}
}
//module.exports = QueryJob;
