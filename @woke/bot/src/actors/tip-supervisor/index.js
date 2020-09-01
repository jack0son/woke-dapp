const {
	ActorSystem,
	adapt,
	actors: { TaskSupervisor },
} = require('@woke/wact');
const tipTaskDefn = require('./tip-task');
const { useNotifyOnCrash } = require('@woke/actors');
const { dispatch, start_actor } = ActorSystem;
const { TaskStatuses: Statuses } = TaskSupervisor;

function spawn_tip_task(_parent, a_wokenContract, tip) {
	return start_actor(_parent)(`_tip-${tip.taskId}`, tipTaskDefn, {
		a_wokenContract,
		tip,
	});
}

function TipSupervisor(a_wokenContract, a_tweeter, opts) {
	const earliestId = (opts && opts.earliestId) || 0;
	const start_task = ({ state, msg, ctx }) => (task) => {
		const a_task = spawn_tip_task(ctx.self, a_wokenContract, task);
		//start_actor(ctx.self)(task.taskId, makeTask(task, ctx.self), {});
		dispatch(a_task, { type: 'start', tip: task }, ctx.self);
		ctx.debug.d(msg, `Started task: ${task.taskId}`);
	};

	const getId = (tip) => tip.id;

	// Ignore all tips that come in after the specified ID (twitter IDs ascend
	// with time)
	const ignoreTask = (tip) =>
		earliestId && tip.id < earliestId
			? 'tip was created before the line in the sand...'
			: false;

	// @TODO check has tip properties
	const isValidTask = (tip) => !!tip.id && true;

	const notify = (statusSymbol) => (state, msg, ctx) => {
		//const notify = ({ state, msg, ctx }) => (statusSymbol) => {
		const { a_tweeter } = state;
		const { task: tip } = msg;
		if (!a_tweeter) {
			ctx.debug.warn(
				msg,
				`No tweeter actor available. Ignoring ${statusSymbol.toString()} effect.`
			);
			return;
		}

		switch (statusSymbol) {
			case Statuses.done:
				dispatch(a_tweeter, { type: 'tweet_tip_confirmed', tip }); //, ctx.self);
				break;
			case Statuses.invalid:
				ctx.debug.warn('supervisor: INVALID EFFECT');
				dispatch(a_tweeter, { type: 'tweet_tip_invalid', tip }); //, ctx.self);
				break;
			case Statuses.failed:
				dispatch(a_tweeter, { type: 'tweet_tip_failed', tip }); //, ctx.self);
				break;
			default:
				ctx.debug.warn(msg, `No notification behaviour for status ${statusSymbol}`);
		}
	};

	// Task status handlers
	const effects = {
		[Statuses.ready]: (state, msg, ctx) => {
			const { task } = msg;
			ctx.receivers.start_task(task);

			return state;
		},
		[Statuses.done]: notify(Statuses.done),
		[Statuses.invalid]: notify(Statuses.invalid),
		[Statuses.failed]: notify(Statuses.failed),

		// [Statuses.done]: (_, __, ctx) => ctx.receivers.notify(Statuses.done),
		// [Statuses.invalid]: (_, __, ctx) => ctx.receivers.notify(Statuses.invalid),
		// [Statuses.failed]: (_, __, ctx) => ctx.receivers.notify(Statuses.failed),
	};

	return adapt(
		{
			actions: {},
			properties: {
				persistenceKey: 'tip-supervisor', // only ever 1, static key OK
				onCrash: useNotifyOnCrash(),
				receivers: [start_task],
				a_wokenContract,
				a_tweeter,
			},
		},
		TaskSupervisor.Definition([getId, isValidTask, { effects, ignoreTask }])
	);
}

module.exports = TipSupervisor;
