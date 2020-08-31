function spawn_tip_task(_parent, tip, a_wokenContract) {
	return start_actor(_parent)(`_tip-${tip.taskId}`, tipActor, {
		a_wokenContract,
		tip,
	});
}

function TipSupervisor(a_wokenContract, a_tweeter, { earliestId }) {
	const start_task = ({ state, msg, ctx }) => (task) => {
		const a_task = spawn_tip_task(ctx.self, task, state.a_wokenContract);
		//start_actor(ctx.self)(task.taskId, makeTask(task, ctx.self), {});
		dispatch(a_task, { type: 'work' }, ctx.self);
		ctx.debug.d(msg, `Started task: ${task.taskId}`);
	};

	const getId = (tip) => tip.id;

	// Ignore all tips that come in after the specified ID (twitter IDs ascend
	// with time)
	const ignoreTask = (tip) =>
		earliestId && tip.id > earliestId
			? false
			: 'tip was created before the line in the sand...';

	// @TODO check has tip properties
	const isValidTask = (tip) => !!tip.id && true;

	const notify = ({ state, msg, ctx }) => (statusSymbol) => {
		const { a_tweeter } = state;
		const { task: tip } = msg;
		if (!a_tweeter) return;
		switch (statusSymbol) {
			case Statuses.done:
				dispatch(a_tweeter, { type: 'tweet_tip_confirmed', tip }); //, ctx.self);
				break;
			case Statuses.invalid:
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

		[Statuses.done]: (state, msg, ctx) => ctx.receivers.notify(Statuses.done),
		[Statuses.invalid]: (state, msg, ctx) => ctx.receivers.notify(Statuses.invalid),
		[Statuses.failed]: (state, msg, ctx) => ctx.receivers.notify(Statuses.failed),
	};

	return adapt(
		{
			actions: {
				get_state: action_getState,
			},
			properties: {
				persistenceKey: 'tip-supervisor', // only ever 1, static key OK
				onCrash: useNotifyOnCrash(),
				receivers: [start_task],
				a_wokenContract,
				a_tweeter,
				..._properties,
			},
		},
		TaskSupervisor.Definition([getId, isValidTask, { effects, ignoreTask }])
	);
}
