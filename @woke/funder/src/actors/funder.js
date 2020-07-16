const { actors: { SinkAdapter }, ActorSystem } = require('@woke/wact');
const JobActor = require('./job');
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

	const log = (...args) => { if(!ctx.recovering) console.log(...args) }
	console.log(`got job with amount ${job.fundAmount}`);

	if(!!ctx.persist && !ctx.recovering) {
		await ctx.persist(msg);
	}


	if(error) {
		job.error = error;
		ctx.debug.error(msg, `job ${job.userId}, error: ${job.error}`)
	}
	ctx.debug.d(msg, `Updated job:${job.userId} to ⊰ ${job.status} ⊱`)

	// FSM effects
	if(!ctx.recovering) {
		switch(job.status) {
			case 'settled': {
				log(`\njob settled: user ${job.userId} job ${job.userId}\n`)
				//dispatch(ctx.self, { type: 'notify', job }, ctx.self);
				break;
			}

			case 'invalid': {
				if(job.reason) {
					//ctx.debug.error(msg, `job ${job.id} from ${job.fromHandle} error: ${job.error}`)
					log(`\njob invalid: ${job.reason}`);
				}
				break;
			}

			case 'failed': {
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

	jobRepo[job.userId] = {
		...jobRepo[job.userId],
		...job,
	}

	return { ...state, jobRepo }
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

function action_notify(msg, ctx, state) {
	const { a_monitor } = state;
	dispatch(a_monitor, { ...msg, type: 'notify' }, ctx.self);
}

function onCrash(msg, error, ctx) {
	console.log(`Funder crash, name: ${ctx.name}`);
	console.log(error);
	console.log(ctx);
	const prefixString = `Funder crashed`;
	dispatch(ctx.self, { type: 'monitor_notify', error, prefixString }, ctx.self);

	return ctx.resume;
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
		'monitor_notify': action_notify,
		'resume': action_resume,
		//'job':  action_incomingJob,
		'update_job': action_updateJob,
	}
}
