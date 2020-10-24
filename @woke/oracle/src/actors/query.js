const { ActorSystem, receivers, reducers, adapters } = require('@woke/wact');
const { dispatch, stop } = ActorSystem;
const { subsumeEffects, Pattern } = reducers;
const { tweetToProofString } = require('../lib/proof-protcol');

function fetchProofTweet(state, msg, ctx) {
	const {
		a_twitterAgent,
		job: { userId },
	} = state;
	ctx.debug.d(msg, `Fetching twitter data for user ${userId}`);
	dispatch(a_twitterAgent, { type: 'find_proof_tweet', userId }, ctx.self);
}

function handleFailure(state, msg, ctx) {
	const { error } = state;
	console.log(error);
	if (error) {
		// Catch error in on crash, schedule new attempt
		if (
			error.message.includes('not found') ||
			error.message.includes('No tweets found')
		) {
			ctx.receivers.update_job({ status: 'failed' }, error);
			return ctx.stop;
		}
		throw error;
	}
	return state;
}

function handleTwitterResponse(state, msg, ctx) {
	const { action, user, error } = msg;
	switch (action) {
		case 'find_proof_tweet': {
			return handleProofTweet(state, msg, ctx);
		}
		default: {
			ctx.debug.d(msg, `No handler defined for response to ${action}`);
			return state;
		}
	}
}

function handleProofTweet(state, msg, ctx) {
	const { userId, tweet, userData, error } = msg;

	if (error) {
		return { ...state, error };
	}

	if (!userId == state.userId)
		throw new Error(
			`Query received user data for incorrect user ${userId}, expected ${state.userId}`
		);

	return { ...state, tweet, userData };
}

function submitQueryTx(state, msg, ctx) {
	ctx.debug.d(msg, 'Submitting query response transaction');
	const { job, a_contract_TwitterOracle, tweet, userData } = state;

	const proofString = tweetToProofString(tweet, userData);
	dispatch(
		a_contract_TwitterOracle,
		{
			type: 'send',
			method: '__callback',
			args: [job.queryId, proofString, '0x0'],
			sinks: [ctx.self],
		},
		ctx.self
	);

	return { ...state, txSent: true };
}

// Add tx data to state
function handleQueryTx(state, msg, ctx) {
	const { error, tx, status } = msg;
	if (tx.method == '__callback') {
		return { ...state, responseTx: { error, tx, status } };
	}
}

function handleQueryFailure(state, msg, ctx) {
	ctx.debug.d(msg, 'Query failed');
	const {
		job: { queryId },
		userId,
		txResponse,
	} = state;
	ctx.receivers.update_job({ status: 'failed' }, txResponse.error);
	stop(ctx.self);
}

function complete(state, msg, ctx) {
	const {
		job: { queryId, userId },
		responseTx,
	} = state;
	ctx.debug.d(msg, `Query complete`);
	ctx.receivers.update_job({
		queryId,
		userId,
		status: 'settled',
		txHash: responseTx.txHash,
	});

	stop(ctx.self);
}

function haveTwitterData(state) {
	return !!state.userData && !!state.tweet;
}

const init = Pattern(
	(state) => !haveTwitterData(state), // predicate
	fetchProofTweet // effect
);

const failed = Pattern(
	({ error }) => !!error, // predicate
	handleFailure
);

const submitQuery = Pattern(
	({ responseTx, ...state }) => haveTwitterData(state) && !responseTx,
	submitQueryTx
);

const queryComplete = Pattern(
	({ responseTx, ...state }) =>
		haveTwitterData(state) && !!responseTx && !!responseTx.tx.receipt,
	complete
);

const queryFailed = Pattern(
	({ responseTx, ...state }) =>
		haveTwitterData(state) && !!responseTx && !!responseTx.error,
	handleQueryFailure
);

const patterns = [init, submitQuery, queryFailed, queryComplete, failed];
const reducer = subsumeEffects(patterns);

function onCrash(msg, error, ctx) {
	console.log(`oracle:query crash, name: ${ctx.name}`);
	error.actorName = ctx.name;
	return ctx.escalate;
}

const update_job = ({ state, msg, ctx }) => (job, error) => {
	const {
		job: { queryId },
		userId,
	} = state;
	dispatch(
		ctx.parent,
		{ type: 'update_job', job: { queryId, userId, ...job }, error },
		ctx.self
	);
};

//function QueryJob(a_twitterAgent, a_contract_TwitterOracle) {
module.exports = {
	properties: {
		onCrash,

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

		receivers: [receivers.sink, update_job],
	},
	actions: {
		...adapters.SinkReduce(reducer),
		start: reducer,
	},
};
