const { dispatch } = require('../../actor-system');
const { TaskStatuses: Statuses, isStatus } = require('./statuses');

const isEffect = (effect) => effect && typeof effect === 'function';

const exampleEffects = {
	[Statuses.init]: () => {},
	[Statuses.failed]: () => {},
};

function Task(taskId, task) {
	return {
		...task,
		taskId,
		status: Statuses.init,
		error: null,
		reason: null,
	};
}

const RESUME_ON = [Statuses.init, Statuses.ready];

/**
 * Task manager actions
 *
 * @param {[TODO:type]} effects - [TODO:description]
 * @return {[TODO:type]} [TODO:description]
 */
function Actions(getId, isValidTask, { effects, reducer, resumeOn }) {
	if (!reducer) reducer = (_, __, state) => state;

	function action_newTask(msg, ctx, state) {
		const { taskRepo, tasksByStatus } = state;
		const { task: _task } = msg;

		const taskId = getId(_task);
		if (!isValidTask(_task)) throw new Error(`New task ${taskId} is not a valid task`);

		if (taskRepo.has(taskId)) return state;

		const task = taskRepo.set(taskId, Task(taskId, _task)).get(taskId);
		tasksByStatus[task.status].set(taskId, task);
		return action_updateTask({ task: { ...task, status: Statuses.ready } }, ctx, {
			...state,
			taskRepo,
		});
	}

	async function action_updateTask(_msg, ctx, _state) {
		const { taskRepo, tasksByStatus } = _state;
		const { task: _task } = _msg;
		const taskId = _task.taskId || getId(_task);

		if (!taskRepo.has(taskId))
			throw new Error(`Attempt to update task ${taskId} which does not exist`);

		if (!isStatus(_task.status))
			throw new Error(
				`Unspecified task status for taskId ${taskId}: ${_task.status.toString()}`
			);

		if (ctx.persist && !ctx.recovering) await ctx.persist(_msg);

		const prev = taskRepo.get(taskId);
		if (_task.status === prev.status) {
			!ctx.recovering &&
				ctx.debug.d(
					_msg,
					`Task ID: ${taskId} already has status ${_task.status.toString()}`
				);
			return _state;
		}

		const task = { ...prev, ..._task };

		if (task.error) {
			ctx.debug.error(task.error);
		}

		taskRepo.set(taskId, task);
		tasksByStatus[prev.status].delete(taskId);
		tasksByStatus[task.status].set(taskId, task);
		const state = { ..._state, taskRepo, tasksByStatus };

		const effect = effects[task.status];
		// Task actors should not reference the taskRepo
		const msg = { task: { ...task } }; // use a copy of the task
		return !ctx.recovering && isEffect(effect)
			? reducer(effect(msg, ctx, state))
			: reducer(msg, ctx, state);
	}

	function action_resumeTasks(msg, ctx, state) {
		const { tasksByStatus } = state;
		// @fix will not update statuses to pending
		(resumeOn || RESUME_ON).forEach((status) =>
			tasksByStatus[status].forEach((task) => effects[status]({ task }, ctx, state))
		);
	}

	function action_abortTasks(msg, ctx, state) {
		const { taskId, status } = msg;

		const abortMsg = (taskId) => ({ task: { taskId, status: statuses.abort } });

		// Abort a single task by taskId
		if (taskId) return action_updateTask(abortMsg(taskId), ctx, state);

		//tasksByStatus[status].forEach(({taskId}) => dispatch(ctx.self, abortMsg(taskId)));
		// Abort all tasks in provided status
		return tasksByStatus[status].reduce(
			(state, task) => action_updateTask(abortMsg(task.taskId), ctx, state),
			state
		);

		// @note using reduce ties execution path for all task effects together - an
		// error will cause state changes from preceeding tasks to be lost
	}

	return { action_newTask, action_updateTask, action_resumeTasks, action_abortTasks };
}

module.exports = Actions;
