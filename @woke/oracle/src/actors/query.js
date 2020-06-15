const { dispatch } = require('nact');
const { tip_str } = require('../lib/utils');
const { receivers } = require('@woke/wact');

const { subsumeReduce } = require('./state-machine');
const { SinkAdapter, Pattern } = require('./adapters');


function fetchTwitterData(msg, ctx, state) {
	debug.d(msg, 'Fetching twitter data');
	const { a_twitterAgent, userId } = state;
	dispatch(a_twitterAgent,  { type: 'find_proof_tweet', userId }, ctx.self);
}

function submitQueryTx(msg, ctx, state) {
	debug.d(msg, 'Submitting query response transaction');
	//dispatch(a_contract_TwitterOracle, {
}

function complete(msg, ctx, state) {
	const { queryId, userId, queryResponse } = state;
	debug.d(msg, 'Query complete');
	dispatch(ctx.parent, { type: 'update_query',
		queryId,
		userId,
		status: 'settled',
		txHash: queryResponse.txHash,
	}, ctx.self);
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
	fetchTwitterData
);

const sumbitQuery = Pattern(
	({twitterData, queryReceipt}) => {
		return !!twitterData && !queryReceipt;
	},
	submitQueryTx
);

const queryComplete = Pattern(
	({twitterData, queryResponse}) => {
		return !!twitterData && !!queryResponse && !!queryResponse.receipt;
	},
	complete
);

const queryFailed = Pattern(
	({queryResponse}) => {
		return !!twitterData && !!queryResponse;
	},
	handleQueryFailure
);

const patterns = [init, submitQuery, queryFailed, queryComplete];
const reducer = subsumeReduce(patterns);

function handleProofTweet(msg, ctx, state) {
	const { userId, tweet } = msg;
	if(!userId == state.userId) throw new Error(`Query received user data for incorrect user ${userId}, expected ${state.userId}`);

	return { ...state, twitterData: { tweet } }; 
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

function handleQueryResponse(msg, ctx, state) {
	const { error, tx, status } = msg;
	return  { ...state, queryResponse: { error, tx, status }};
}

function QueryJob(a_twitterAgent, a_contract_TwitterOracle) {
	return {
		properties: {
			initialState: {
				userId: null,
				sinkHandlers: {
					twitter: handleTwitterResponse, 
					queryTx: handleQueryResponse,
				},
			},

			receiversDisabled: (bundle) => ({
				sink: sink(bundle),
			}),

			onCrash: undefined,
		},
		actions: {
			...SinkAdapter(reducer),
		}
	}
}


module.exports = OracleOrchestrator;
