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

	switch(action) {
		case 'complete': {
			return completeJob(msg, ctx, state);
		}
	}
}

// Send tip to WokeToken contract
// @returns tip actor
function settle_tip(msg, ctx, state) {
	ctx.debug.info(msg, `Spawning tip actor...`);
	const a_tip = spawn_tip(ctx.self, msg.tip, state.a_wokenContract);
	dispatch(a_tip, { type: 'tip', tip: msg.tip }, ctx.self);
	
	return a_tip;
}

function spawn_job(_parent, job, a_oracleContract, a_twitterApi) {
		return start_actor(_parent)(
			`_job-${job.id}`,
			jobActor,
			{
				a_wokenContract,
				a_twitterApi,
				job,
			}
		);
}

function settle_job(msg, ctx, state) {
	return (job) => {
	ctx.debug.info(msg, `Spawning job actor...`);
	const a_job = spawn_job(ctx.self, msg.job, state.a_wokenContract, state.a_twit);
	dispatch(a_job, { type: 'job', job: msg.job }, ctx.self);
	return a_job;

	}
}

function handleIncomingQuery(msg, ctx, state) {
	const { query } = msg;
	const { jobs } = state;

	let job = jobs[query.id];
	if(!job) {
		job = { id, status: statusEnum.UNSETTLED, error: null };
		return settle_job(job);
		// start the job
	} else {
		// attempt to settle existing job
		switch(job.status) {
			case statusEnum.UNSETTLED: {
			}

			default: {
			}
		}
	}
}


function completeJob(msg, ctx, state) {
	const { jobs, jobId, status } = msg;
	const job = jobs[jobId];

	job.status = status;

	return {...state, jobs};
}

function startJob(msg, ctx, status) {
}

const properties = {
	initialState: {
		sinkHandlers: {
			subscription: handleIncomingQuery,
			queryJob: handleJobResponse,
		},

		receivers: { settle_job },
	}
}

const actions = {
	...SinkAdapter(reducer),
}
