const { actors: { SinkAdapter }, ActorSystem } = require('@woke/wact');
const JobJob = require('./job');
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
function spawn_job(_parent, job, a_txManager) {
	return start_actor(_parent)(
		`_job-${job.jobId}`,
		JobJob,
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
		const a_job = spawn_job(ctx.self, job, state.a_txManager);
		dispatch(a_job, { type: 'start' }, ctx.self);
		return a_job;
	}
}

function action_resume(msg, ctx, state) {
	const { jobRepo } = state;

	Object.keys(jobRepo).forEach(jobId => {
		const job = jobRepo[jobId];
		if(job.status == 'UNSETTLED') {
			ctx.receivers.settle_job(job);
		}
	});
}

async function action_updateJob(msg, ctx, state) {
	const { jobRepo } = state;
	const { job, error } = msg;

	const log = (...args) => { if(!ctx.recovering) console.log(...args) }

	if(ctx.persist && !ctx.recovering) {
		await ctx.persist(msg);
	}

	if(error) {
		job.error = error;
		ctx.debug.error(msg, `job ${job.jobId}, error: ${job.error}`)
	}
	ctx.debug.d(msg, `Updated job:${job.jobId} to ⊰ ${job.status} ⊱`)

	// FSM effects
	if(!ctx.recovering) {
		switch(job.status) {
			case 'SETTLED': {
				log(`\njob settled: user ${job.userId} job ${job.jobId}\n`)
				//dispatch(ctx.self, { type: 'notify', job }, ctx.self);
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

	jobRepo[job.jobId] = {
		...jobRepo[job.jobId],
		...job,
	}

	return { ...state, jobRepo }
}

function action_incomingJob(msg, ctx, state) {
	const { address, userId } = msg;
	const { jobRepo } = state;
	const jobId = userId;

	let job = jobRepo[jobId];
	if(!job) {
		job = { address, userId, status: statusEnum.PENDING };
		job.a_job = ctx.receivers.settle_job(job);
		ctx.debug.d(msg, `Started job: ${jobId}`);
		// start the job
	} else {
		// attempt to settle existing job
		switch(job.status) {
			case statusEnum.SETTLED:
				ctx.debug.d(msg, `Job already settled: ${jobId}`);
				break;

			case statusEnum.UNSETTLED:
				job.a_job = ctx.receivers.settle_job(job);
				break;

			case statusEnum.PENDING:
				ctx.debug.d(msg, `Job already pending: ${jobId}`);
				break;

			case statusEnum.FAILED:
				ctx.debug.d(msg, `Job already failed: ${jobId}`);
			default:
				return state;
		}
	}
	jobRepo[jobId] = job;
	return { ...state, jobRepo };
}

// ----- Sink handlers
// None

// ----- Funder actor definition
module.exports = {
	properties: {
		persistenceKey: 'funder', // only ever 1, static key OK

		initialState: {
			jobRepo: [],
		},

		receivers: (bundle) => ({ 
			settle_job: settle_job(bundle),
		}),
	},

	actions: {
		...SinkAdapter(),
		'init': (msg, ctx, state) => {
			return action_resume(msg, ctx, state);
		},
		'fund': action_incomingJob,
		'resume': action_resume,
		'job':  action_incomingJob,
		'update_job': action_updateJob,
	}
}
