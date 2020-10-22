const {
	ActorSystem,
	adapt,
	actors: { TaskSupervisor },
} = require('@woke/wact');
const web3Utils = require('web3-utils');
const assert = require('assert');
const { useNotifyOnCrash } = require('@woke/actors');
const { configure } = require('@woke/lib');
const TaskActor = require('./task');
const { dispatch, start_actor } = ActorSystem;
const { TaskStatuses: Statuses } = TaskSupervisor;

const isValidFundingTask = (task) => !!task.userId && !!task.address;

// const Task = (userId, address, fundAmount) => ({ userId, address, fundAmount });

const taskToString = (task) =>
	`userId: ${task.userId}, amount: ${web3Utils.fromWei(
		task.fundAmount.toString(),
		'ether'
	)}, address: ${task.address}`;
// const taskToString = (task) =>
// 	`userId: ${task.userId.padStart(20)}, amount: ${web3Utils
// 		.fromWei(task.fundAmount.toString(), 'ether')
// 		.padStart(5)}, address: ${task.address}`;

const defaultOpts = { fundAmount: web3Utils.toWei('0.4', 'ether') };
function FundingSupervisor(a_txManager, userRegistryAddress, opts) {
	const conf = configure(opts, defaultOpts);

	function spawn_funding_task(_parent, task) {
		return start_actor(_parent)(`_task-${task.userId}`, TaskActor, {
			task,
			a_txManager,
		});
	}

	const getId = (task) => {
		assert(typeof userRegistryAddress === 'string');
		assert(typeof task.userId === 'string');
		return web3Utils.sha3(task.userId + userRegistryAddress);
	};

	// Start a funding task
	const start_task = ({ state, msg, ctx }) => (task) => {
		const a_task = spawn_funding_task(ctx.self, task);
		//start_actor(ctx.self)(task.taskId, makeTask(task, ctx.self), {});
		dispatch(a_task, { type: 'start', tip: task }, ctx.self);
		ctx.debug.d(msg, `Started task: ${task.taskId}`);
	};

	const isValidTask = isValidFundingTask;

	const debugTaskProblem = (debug) => ({ error, reason }) => {
		debug(
			`${status ? status.toString() : 'Problem'} funding task`,
			taskToString(task),
			'\n',
			reason ? `reason: ${reason} ` : '',
			error ? `error: ${error}` : ''
		);
	};

	const problemEffect = (status) => (_, msg, { debug }) =>
		debugTaskProblem((...args) => debug(msg, ...args))(task, status);

	const effects = {
		[Statuses.ready]: (state, msg, ctx) => {
			const { fundAmount } = state;
			const { task } = msg;
			if (!fundAmount) {
				throw new Error(`Funder must define a fundAmount`);
			}
			task.fundAmount = fundAmount;
			ctx.receivers.start_task(task);
			return state;
		},
		[Statuses.done]: (state, msg, ctx) => {
			const { task } = msg;
			ctx.debug.d(msg, `Completed funding task: ${taskToString(task)}`);
			conf.onFundingComplete && conf.onFundingComplete(task);
		},
		[Statuses.invalid]: problemEffect(Statuses.invalid),
		[Statuses.failed]: problemEffect(Statuses.failed),
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
		TaskSupervisor.Definition([getId, isValidTask, { effects }])
	);
}

module.exports = FundingSupervisor;
