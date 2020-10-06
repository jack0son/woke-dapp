const {
	ActorSystem,
	adapt,
	actors: { TaskSupervisor },
} = require('@woke/wact');
const web3Utils = require('web3-utils');
const assert = require('assert');
const { useNotifyOnCrash } = require('@woke/actors');
const { configure } = require('@woke/lib');
const JobActor = require('./job');
const { dispatch, start_actor } = ActorSystem;
const { TaskStatuses: Statuses } = TaskSupervisor;

const isValidFundingJob = (job) => !!job.userId && !!job.address && !!job.fundAmount;

const Job = (userId, address, fundAmount) => ({ userId, address, fundAmount });

const jobToString = (job) =>
	`userId: ${job.userId.padStart(20)}, amount: ${web3Utils
		.fromWei(job.fundAmount, 'eth')
		.padStart(5)}, address: ${job.address}`;

const defaultOpts = { fundAmount: web3Utils.toWei(0.4, 'eth') };
function FundingSupervisor(a_txManager, userRegistryAddress, opts) {
	const conf = configure(opts, defaultOpts);

	function spawn_funding_job(_parent, job) {
		return start_actor(_parent)(`_job-${job.userId}`, JobActor, {
			job,
			a_txManager,
		});
	}

	const getId = (job) => {
		assert(typeof userRegistryAddress === 'string');
		assert(typeof job.id === 'string');
		return web3Utils.sha3(job.userId + userRegistryAddress);
	};

	// Start a funding job
	const start_task = ({ state, msg, ctx }) => (task) => {
		const a_task = spawn_funding_job(ctx.self, task);
		//start_actor(ctx.self)(task.taskId, makeTask(task, ctx.self), {});
		dispatch(a_task, { type: 'start', tip: task }, ctx.self);
		ctx.debug.d(msg, `Started task: ${task.taskId}`);
	};

	const isValidTask = isValidFundingJob;

	const debugJobProblem = (debug) => ({ error, reason }) => {
		debug(
			`${status ? status.toString() : 'Problem'} funding job`,
			jobToString(job),
			'\n',
			reason ? `reason: ${reason} ` : '',
			error ? `error: ${error}` : ''
		);
	};

	const problemEffect = (status) => (_, msg, { debug }) =>
		debugJobProblem((...args) => debug(msg, ...args))(job, status);

	const effects = {
		[Statuses.ready]: (state, msg, ctx) => {
			const { address, userId } = msg;
			if (!fundAmount) {
				throw new Error(`Funder must define a fundAmount`);
			}
			const job = Job(userId, address, fundAmount);
			ctx.receivers.start_task(job);
			return state;
		},
		[Statuses.done]: (state, msg, ctx) => {
			console.log(msg);
			const { job } = msg;
			ctx.debug.d(msg, `Completed funding job: ${jobToString(job)}`);
			conf.doneCallback && conf.doneCallback(job);
		},
		[Statuses.invalid]: problemEffect(Statuses.invalid),
		[Statuses.failed]: problemEffect(statuses.failed),
	};

	return adapt(
		{
			actions: {},
			properties: {
				persistenceKey: 'tip-supervisor', // only ever 1, static key OK
				onCrash: useNotifyOnCrash(),
				receivers: [start_task],
				initialState: {
					fundAmount: conf.fundAmount,
					a_txManager,
					userRegistryAddress,
				},
			},
		},
		// [actionArgs, propertyArgs]
		TaskSupervisor.Definition([getId, isValidTask, { effects, ignoreTask }])
	);
}

module.exports = FundingSupervisor;
