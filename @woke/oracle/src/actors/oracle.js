const { actors: { SinkAdapter }, ActorSystem } = require('@woke/wact');
const QueryJob = require('./query');
const { dispatch, start_actor } = ActorSystem;
// Each job is a simple linear state machine
const statuses = [
	'UNSETTLED',
	'PENDING',
	'SETTLED',
	'FAILED',
	'INVALID',
];
const statusEnum = {};
statuses.forEach((s, i) => statusEnum[s] = i);

// Send tip to WokeToken contract
// @returns tip actor
function spawn_job(_parent, job, a_contract_TwitterOracle, a_twitterAgent) {
	return start_actor(_parent)(
		`_job-${job.queryId}`,
		QueryJob,
		{
			a_contract_TwitterOracle,
			a_twitterAgent,
			job,
		}
	);
}

function settle_job({msg, ctx, state}) {
	return (job) => {
		ctx.debug.info(msg, `Spawning job actor...`);
		const a_job = spawn_job(ctx.self, job, state.a_contract_TwitterOracle, state.a_twitterAgent);
		dispatch(a_job, { type: 'start' }, ctx.self);
		//dispatch(a_job, { type: 'start', job: job }, ctx.self);
		return a_job;
	}
}

async function update_job(msg, ctx, state) {
	const { jobRepo, wokenContract } = state;
	const { job, error } = msg;

	const log = (...args) => { if(!ctx.recovering) console.log(...args) }

	if(ctx.persist && !ctx.recovering) {
		await ctx.persist(msg);
	}

	if(error) {
		job.error = error;
		ctx.debug.error(msg, `job ${job.queryId}, error: ${job.error}`)
	}
	ctx.debug.d(msg, `Updated job:${job.queryId} to ⊰ ${job.status} ⊱`)

	// FSM effects
	if(!ctx.recovering) {
		switch(job.status) {
			case 'SETTLED': {
				log(`\njob settled: user ${job.userId} query ${job.queryId}\n`)
				dispatch(ctx.self, { type: 'notify', job }, ctx.self);
				break;
			}

			case 'INVALID': {
				if(job.reason) {
					//ctx.debug.error(msg, `job ${job.id} from ${job.fromHandle} error: ${job.error}`)
					log(`\njob invalid: ${job.reason}`);
				}
				break;
			}

			case 'FAILED': {
				if(error) {
					//ctx.debug.error(msg, `job ${job.id} from ${job.fromHandle} error: ${job.error}`)
					log(`\njob failed: ${job.error}`);
				}
				break;
			}

			default: {
			}
		}
	}

	jobRepo[job.queryId] = {
		...jobRepo[job.queryId],
		...job,
	}

	return { ...state, jobRepo }
}

function handleIncomingQuery(msg, ctx, state) {
	const { query } = msg;
	const { jobRepo } = state;

	const { queryId, userId } = query;

	let job = jobRepo[queryId];
	if(!job) {
		job = { queryId, userId, status: statusEnum.PENDING };
		job.a_job = ctx.receivers.settle_job(job);
		ctx.debug.d(msg, `Started query job: ${queryId}`);
		// start the job
	} else {
		// attempt to settle existing job
		switch(job.status) {
			case statusEnum.SETTLED:
				ctx.debug.d(msg, `Query already settled: ${queryId}`);
				break;

			case statusEnum.UNSETTLED:
				job.a_job = ctx.receivers.settle_job(job);
				break;

			case statusEnum.PENDING:
				ctx.debug.d(msg, `Query already pending: ${queryId}`);
				break;

			case statusEnum.FAILED:
				ctx.debug.d(msg, `Query already failed: ${queryId}`);
			default:
				return state;
		}
	}
	jobRepo[queryId] = job;
	return { ...state, jobRepo };
}

// ----- Sink handlers
function handleContractResponse(msg, ctx, state) {
	switch(msg.action) {
		case 'subscribe_log': {
			const { a_sub } = msg;
			// Once subscription received from contract, start the subscription
			if(a_sub) {
				const a_tweet_lodged_sub = a_sub;
				dispatch(a_tweet_lodged_sub,  { type: 'start' }, ctx.self);
				return { ...state, a_tweet_lodged_sub };
			}
		}
		default: {
			ctx.debug.d(msg, `No handler defined for response to ${action}`);
		}
	}
}

function handleQuerySubscription(msg, ctx, state) {
	const { eventName } = msg;
	switch(eventName) {
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

		initialState: {
			jobRepo: [],
			sinkHandlers: {
				subscribe_log: handleQuerySubscription,
				a_contract: handleContractResponse,
			},

			a_twitterAgent: null,
			a_contract_TwitterOracle: null,

		},

		receivers: (bundle) => ({ 
			settle_job: settle_job(bundle),
			//sink: sink(bundle),
		}),
	},

	actions: {
		...SinkAdapter(),
		'init': (msg, ctx, state) => {
			const { a_contract_TwitterOracle, subscriptionWatchdogInterval } = state;

			console.log('subscriptionWatchdogInterval', subscriptionWatchdogInterval);
			// Rely on subscription to submit logs from block 0
			// @TODO persist last seen block number
			dispatch(a_contract_TwitterOracle, {	type: 'subscribe_log',
				resubscribeInterval: subscriptionWatchdogInterval,
				eventName: 'FindTweetLodged',
				opts: { fromBlock: 0 },
				filter: e => true,
			}, ctx.self);
		},

		'query': handleIncomingQuery,
		'a_sub': handleQuerySubscription,
		'update_job': update_job,

		'stop': (msg, ctx, state) => {
			// Stop subscription
		},
	}
}

//module.exports = OracleOrchestrator;
