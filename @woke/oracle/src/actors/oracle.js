const { actors: { SinkAdapter }, ActorSystem } = require('@woke/wact');
const { dispatch } = ActorSystem;
// Each tip is a simple linear state machine
const statuses = [
	'UNSETTLED',
	'SETTLED',
	'FAILED',
	'INVALID',
];
const statusEnum = {};
statuses.forEach((s, i) => statusEnum[s] = i);

function handleJobResponse(msg, ctx, state) {
	const { action } = state;

	update_job(msg, ctx, state);
	//switch(action) {
	//	case 'complete': {
	//		return completeJob(msg, ctx, state);
	//	}
	//}
}

// Send tip to WokeToken contract
// @returns tip actor
function spawn_job(_parent, job, a_contract_TwitterOracle, a_twitterAgent) {
		return start_actor(_parent)(
			`_job-${job.id}`,
			jobActor,
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
		const a_job = spawn_job(ctx.self, msg.job, state.a_wokenContract, state.a_twit);
		dispatch(a_job, { type: 'job', job: msg.job }, ctx.self);
		return a_job;

	}
}

//
		//		-- is it tip or tipper that is responsible for tip.status?
async function update_job(msg, ctx, state) {
	const { jobRepo, wokenContract } = state;
	const { job, status, error} = msg;

	const log = (...args) => { if(!ctx.recovering) console.log(...args) }

	if(ctx.persist && !ctx.recovering) {
		await ctx.persist(msg);
	}

	if(job.error) {
		ctx.debug.error(msg, `job ${job.id} from ${job.fromHandle} error: ${job.error}`)
	}
	ctx.debug.d(msg, `Updated job:${job.id} to ⊰ ${job.status} ⊱`)

	// FSM effects
	if(!ctx.recovering) {
		switch(job.status) {
			case 'SETTLED': {
				log(`\njob settled: @${job.fromHandle} jobped @${job.toHandle} ${job.amount} WOKENS\n`)
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
				if(job.error) {
					//ctx.debug.error(msg, `job ${job.id} from ${job.fromHandle} error: ${job.error}`)
					log(`\njob failed: ${job.error}`);
				}
				break;
			}

			default: {
			}
		}
	}

	jobRepo[job.id] = {
		...jobRepo[job.id],
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
		job = { queryId, userId, status: statusEnum.UNSETTLED, error: null };
		job.a_job = ctx.receivers.settle_job(job);
		// start the job
	} else {
		// attempt to settle existing job
		switch(job.status) {
			case statusEnum.UNSETTLED: {
				job.a_job = ctx.receivers.settle_job(job);
			}

			case statusEnum.FAILED: {
				debug.d(msg, `Query ${query.id} already failed.`);
				break;
			}
			default:
		}
	}
	jobRepo[query.id] = job;
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
				dispatch(a_tweet_lodged_sub,  {type: 'start'}, ctx.self);
				return { ...state, a_tweet_lodged_sub };
			}
		}
		default: {
			debug.d(msg, `No handler defined for response to ${action}`);
		}
	}
}

function handleQuerySubscription(msg, ctx, state) {
	const { eventName } = msg;
	switch(eventName) {
		case 'FindTweetLodged': {
			// Event update from subscription
			dispatch(ctx.self, { type: 'query', query: msg.log }, ctx.self);
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
		initialState: {
			sinkHandlers: {
				subscribe_log: handleQuerySubscription,
				a_contract: handleContractResponse,
			},

			a_twitterAgent: null,
			a_contract_TwitterOracle: null,

			receivers: (bundle) => ({ 
				settle_job: settle_job(bundle),
				//sink: sink(bundle),
			}),
		}
	},

	actions: {
		...SinkAdapter(),
		'init': (msg, ctx, state) => {
			const { a_contract_TwitterOracle } = state;

			// Subscribe to unclaimed transfers

			// Rely on subscription to submit logs from block 0
			// @TODO persist last seen block number
			dispatch(a_contract_TwitterOracle, {	type: 'subscribe_log',
				eventName: 'FindTweetLodged',
				opts: { fromBlock: 0 },
				filter: e => true,
			}, ctx.self);
		},

		'query': handleIncomingQuery,
		'update_job': update_job,

		'stop': (msg, ctx, state) => {
			// Stop subscription
		},
	}
}

//module.exports = OracleOrchestrator;
