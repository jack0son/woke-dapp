const { ActorSystem, adapters } = require('@woke/wact');
const { useNotifyOnCrash } = require('@woke/actors');
const Query = require('./query');
const { dispatch, start_actor } = ActorSystem;
// Each job is a simple linear state machine
const statuses = ['UNSETTLED', 'PENDING', 'SETTLED', 'FAILED', 'INVALID'];
const statusEnum = {};
statuses.forEach((s, i) => (statusEnum[s] = i));

// Send tip to WokeToken contract
// @returns tip actor
function spawn_job(_parent, job, a_contract_TwitterOracle, a_twitterAgent) {
	return start_actor(_parent)(`_job-${job.queryId}`, Query, {
		a_contract_TwitterOracle,
		a_twitterAgent,
		job,
	});
}

function settle_job({ state, msg, ctx }) {
	return (job) => {
		const a_job = spawn_job(
			ctx.self,
			job,
			state.a_contract_TwitterOracle,
			state.a_twitterAgent
		);
		dispatch(a_job, { type: 'start' }, ctx.self);
		ctx.debug.d(msg, `Started query job: ${job.queryId}`);
		//dispatch(a_job, { type: 'start', job: job }, ctx.self);
		return a_job;
	};
}

async function action_updateQuery(state, msg, ctx) {
	const { jobRepo } = state;
	const { job, error } = msg;

	const log = (...args) => {
		if (!ctx.recovering) console.log(...args);
	};

	if (ctx.persist && !ctx.recovering) {
		await ctx.persist(msg);
	}

	if (error) {
		job.error = error;
		ctx.debug.error(msg, `job ${job.queryId}, error: ${job.error}`);
	}
	ctx.debug.d(msg, `Updated job:${job.queryId} to ⊰ ${job.status} ⊱`);

	if (!ctx.recovering) {
		switch (job.status.toLowerCase()) {
			case 'settled':
				log(`\nQuery resolved: user ${job.userId} query ${job.queryId}\n`);
				break;

			case 'invalid':
				if (job.reason) {
					//ctx.debug.error(msg, `job ${job.id} from ${job.fromHandle} error: ${job.error}`)
					log(`\nQuery invalid: ${job.reason}`);
				}
				break;

			case 'failed':
				if (error) {
					//ctx.debug.error(msg, `job ${job.id} from ${job.fromHandle} error: ${job.error}`)
					log(`\nQuery failed: ${job.error}`);
				}
				break;

			default:
				throw new Error(`Attempt to update query to unknown status: ${job.status}`);
				break;
		}
	}

	jobRepo[job.queryId] = {
		...jobRepo[job.queryId],
		...job,
	};

	return { ...state, jobRepo };
}

const isUnresolvedQuery = (query) =>
	query.status === 'settled' || query.status === 'pending';

// Find any unresolved queries and resume processing them
function action_resumeQueries(state, msg, ctx) {
	const { jobRepo } = state;
	const unresolvedQueries = Object.keys(jobRepo).filter(isUnresolvedQuery);
	ctx.debug.d(msg, `Settling ${unresolvedQueries.length} unresolved queries...`);
	unresolvedQueries.forEach(ctx.receivers.settle_job);
}

function action_handleIncomingQuery(state, msg, ctx) {
	const { query } = msg;
	const { jobRepo } = state;

	const { queryId, userId } = query;

	const idStr = `userId: ${userId} queryId: ${queryId}`;

	let job = jobRepo[queryId];
	if (!job) {
		ctx.debug.d(msg, `New query ${idStr}. Settling...`);
		job = { queryId, userId, status: 'pending' };

		// @TODO do not need to associate job actor to job lookup
		// Doing this would cause actor memory to be persisted
		//job.a_job = ctx.receivers.settle_job(job);
		// start the job
		ctx.receivers.settle_job(job);
	} else {
		// Attempt to settle existing job
		if (!job.status.toLowerCase) console.log('unknown job status:', job.status);
		switch (job.status.toLowerCase()) {
			case 'settled':
				//case statusEnum.SETTLED:
				ctx.debug.d(msg, `Incoming ${idStr}. Query already settled.`);
				break;

			case 'unsettled':
				//case statusEnum.UNSETTLED:
				ctx.debug.d(msg, `Incoming ${idStr}. Settling...`);
				ctx.receivers.settle_job(job);
				break;

			case 'pending':
				//case statusEnum.PENDING:
				ctx.debug.d(msg, `Incoming ${idStr}. Query already pending.`);
				break;

			case 'failed':
				//case statusEnum.FAILED:
				ctx.debug.d(msg, `Incoming ${idStr}. Query already failed.`);
				break;

			default:
				throw new Error(`Unspecified query status: ${job.status}`);
		}
	}
	jobRepo[queryId] = job;
	return { ...state, jobRepo: { ...jobRepo, [queryId]: job } };
}

// ----- Sink handlers
function handleContractResponse(state, msg, ctx) {
	switch (msg.action) {
		case 'subscribe_log': {
			const { a_sub } = msg;
			// Once subscription received from contract, start the subscription
			if (a_sub) {
				const a_tweet_lodged_sub = a_sub;
				dispatch(a_tweet_lodged_sub, { type: 'start' }, ctx.self);
				return { ...state, a_tweet_lodged_sub };
			}
		}
		default: {
			ctx.debug.d(msg, `No handler defined for response to ${action}`);
		}
	}
}

function action_handleQuerySubscription(state, msg, ctx) {
	const { eventName } = msg;
	switch (eventName) {
		case 'FindTweetLodged': {
			const { log } = msg;
			// Event update from subscription
			const { event, ...logData } = log;
			const query = { ...event, logData };
			dispatch(ctx.self, { type: 'query', query }, ctx.self);
			break;
		}

		default: {
			ctx.debug.info(msg, `No action defined for subscription to '${eventName}' events`);
		}
	}
}

//function OracleOrchestrator(a_twitterAgent, a_contract_TwitterOracle) {
// ----- Oracle actor definition
module.exports = {
	properties: {
		persistenceKey: 'oracle', // only ever 1, static key OK
		onCrash: useNotifyOnCrash(),

		initialState: {
			jobRepo: [],
			sinkHandlers: {
				subscribe_log: action_handleQuerySubscription,
				a_contract: handleContractResponse,
			},

			a_twitterAgent: null,
			a_contract_TwitterOracle: null,
		},

		receivers: [settle_job],
	},

	actions: {
		...adapters.SinkReduce(),
		init: (state, msg, ctx) => {
			const { a_contract_TwitterOracle, subscriptionWatchdogInterval } = state;

			// Rely on subscription to submit logs from block 0
			// @TODO persist last seen block number
			dispatch(
				a_contract_TwitterOracle,
				{
					type: 'subscribe_log',
					resubscribeInterval: subscriptionWatchdogInterval,
					eventName: 'FindTweetLodged',
					opts: { fromBlock: 0 },
					filter: (e) => true,
				},
				ctx.self
			);

			return action_resumeQueries(state, msg, ctx);
		},

		query: action_handleIncomingQuery,
		a_sub: action_handleQuerySubscription,
		update_job: action_updateQuery,

		stop: (state, msg, ctx) => {
			// @TODO call stop
			// Stop subscription
		},
	},
};

//module.exports = OracleOrchestrator;
