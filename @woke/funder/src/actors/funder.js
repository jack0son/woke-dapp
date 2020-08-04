const { actors: { SinkAdapter }, ActorSystem } = require('@woke/wact');
const JobActor = require('./job');

const { useNotifyOnCrash } = require('@woke/actors');
const notifyOnCrash = useNotifyOnCrash();

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
	return start_actor(_parent)(`_job-${job.userId}`, JobActor, {
		job, a_txManager,
	});
}

function settle_job({msg, ctx, state}) {
	return (job) => {
		ctx.debug.info(msg, `Spawning job actor...`);
		const a_job = spawn_job(ctx.self, job, state.a_txManager);
		dispatch(a_job, { type: 'start', meta: 'new_job' }, ctx.self);
		dispatch(ctx.self, { type: 'update_job', job }, ctx.self);
		return a_job;
	}
}

function action_resume(msg, ctx, state) {
	const { jobRepo } = state;

	Object.keys(jobRepo).forEach(jobId => {
		const job = jobRepo[jobId];
		if(job.status == 'unsettled' || job.status == 'pending') {
			ctx.receivers.settle_job(job);
		}
	});
}

async function action_updateJob(msg, ctx, state) {
	const { jobRepo } = state;
	const { job, error } = msg;

	const existingJob = jobRepo[job.userId];
	const newJob = { ...existingJob, ...job };

	const log = (...args) => { if(!ctx.recovering) console.log(...args) }

	if(!!ctx.persist && !ctx.recovering) {
		await ctx.persist(msg);
	}

	if(error) {
		newJob.error = error;
		ctx.debug.error(msg, `job ${newJob.userId}, error: ${newJob.error}`);
	}
	ctx.debug.d(msg, `Updated job:${newJob.userId} to ⊰ ${newJob.status} ⊱`)

	// FSM effects
	if(!ctx.recovering) {
		console.log(`Got job with amount ${newJob.fundAmount}`);
		switch(newJob.status) {
			case 'settled': 
				log(`\njob settled: user ${newJob.userId} job ${newJob.userId}\n`)
				break;

			case 'unsettled': 
				break;

			case 'pending':
				break;

			case 'invalid': 
				if(newJob.reason) {
					log(`\njob invalid: ${newJob.reason}`);
				}
				break;

			case 'failed':
				if(error) {
					//ctx.debug.error(msg, `job ${newJob.id} from ${newJob.fromHandle} error: ${newJob.error}`)
					log(`\njob failed: ${newJob.error}`);
				}
				break;

			default:
				throw new Error(`Unspecified job status '${newJob.status}`);
		}
	}

	return { ...state, jobRepo: { ...jobRepo, [job.userId]: newJob } };
}

function action_incomingJob(msg, ctx, state) {
	const { address, userId } = msg;
	const { jobRepo, fundAmount } = state;

	if(!fundAmount) {
		throw new Error(`Funder must define a fundAmount`);
	}

	let job = jobRepo[userId];
	if(!job) {
		job = { address, userId, status: 'unsettled', fundAmount };
		ctx.receivers.settle_job(job);
		ctx.debug.d(msg, `Started job: ${userId}`);
		// start the job
	} else {
		// attempt to settle existing job
		switch(job.status) {
			case 'settled': //statusEnum.SETTLED:
				ctx.debug.d(msg, `Job already settled: ${userId}`);
				break;

			case 'unsettled': //statusEnum.UNSETTLED:
				job.a_job = ctx.receivers.settle_job(job);
				break;

			case 'pending': //statusEnum.PENDING:
				ctx.debug.d(msg, `Job already pending: ${userId}`);
				break;

			case 'failed': //statusEnum.FAILED:
				ctx.debug.d(msg, `Job already failed: ${userId}`);
			default:
				ctx.debug.d(msg, `No handler specified for status '${job.status}'`);
				return state;
		}
	}

	jobRepo[userId] = job;
	return { ...state, jobRepo: { ...jobRepo, [userId]: job } }
}

function onCrash(msg, error, ctx) {
	return notifyOnCrash(msg, error, ctx);
}

// ----- Sink handlers
// None

// ----- Funder actor definition
module.exports = {
	properties: {
		onCrash,
		persistenceKey: 'funder', // only ever 1, static key OK

		initialState: {
			jobRepo: [],
			fundAmount: 0,
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
		//'job':  action_incomingJob,
		'update_job': action_updateJob,
	}
}
