const { dispatch } = require('nact');
const { tip_str } = require('../lib/utils');

const { subsumeReduce } = require('./state-machine');
const { SinkAdapter, Pattern } = require('./adapters');


function fetchTwitterData(msg, ctx, state) {
	debug.d(msg, 'Fetching twitter data');
}

function submitQueryTx(msg, ctx, state) {
	debug.d(msg, 'Submitting query response transaction');
}

function complete(msg, ctx, state) {
	debug.d(msg, 'Query complete');
}

function handleQueryFailure(msg, ctx, state) {
	debug.d(msg, 'Query complete');
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

const submitQuery = Pattern(
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


function OracleOrchestrator(a_twitterAgent, a_oracleContract) {
	return {
		properties: {
			initialState: {
				sinkHandlers: {
					twitter: handleTwitterResponse, 
					queryTx: handleQueryResponse,
				},
			},

			onCrash: undefined,
		},
		actions: {
			...SinkAdapter(reducer),
		}
	}
}


module.exports = OracleOrchestrator;
