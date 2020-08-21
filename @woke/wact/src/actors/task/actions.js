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

const RESTART_ON = [Statuses.init, Statuses.ready, Statuses.pending];

/**
 * Task manager actions
 *
 * @param {[TODO:type]} effects - [TODO:description]
 * @return {[TODO:type]} [TODO:description]
 */
function Actions(getId, isValidTask, { effects, reducer, restartOn }) {
	if (!reducer) reducer = (_, __, state) => state;

	function action_newTask(state, msg, ctx) {
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
			? reducer(effect(state, msg, ctx))
			: reducer(state, msg, ctx);
	}

	// Simple restart functionality
	// Just go back to ready state
	function action_restartTasks(msg, ctx, _state) {
		const { tasksByStatus } = _state;
		const { taskId } = msg;

		// @fix action function does not now action type that identifies its calling
		// actor
		const restartMsg = (taskId) => ({
			type: 'update',
			task: { taskId, status: Statuses.ready },
		});
		const initMsg = (taskId) => ({ task: { taskId, status: Statuses.init } });

		if (taskId) return action_updateTask(restartMsg(taskId), ctx, _state);

		const tasks = (restartOn || RESTART_ON).reduce((tasks, status) => {
			// Can't use reduce on a map... so we do this garbo
			tasksByStatus[status].forEach((t) => {
				tasks.push(t);
			});
			return tasks;
		}, []);

		return tasks.reduce((state, task) => {
			dispatch(ctx.self, restartMsg(task.taskId), ctx.self);
			return { ...state, ...action_updateTask(initMsg(task.taskId), ctx, state) };
		}, _state);
	}

	// @TODO: unused
	function action_resumeTasks(state, msg, ctx) {
		// @fix will not update statuses to pending
		// (restartOn || RESTART_ON).forEach((status) =>
		// 	tasksByStatus[status].forEach((task) =>
		// 		effects[status]({ task }, ctx, state)
		// 	)
		// );
		return state;
	}

	function action_abortTasks(state, msg, ctx) {
		const { taskId, status } = msg;

		const abortMsg = (taskId) => ({ task: { taskId, status: Statuses.abort } });

		// Abort a single task by taskId
		if (taskId) return action_updateTask(abortMsg(taskId), ctx, state);

		//tasksByStatus[status].forEach(({taskId}) => dispatch(ctx.self, abortMsg(taskId)));
		// Abort all tasks in provided status
		return tasksByStatus[status].values.reduce(
			(state, task) => action_updateTask(abortMsg(task.taskId), ctx, state),
			state
		);

		// @note using reduce ties execution path for all task effects together - an
		// error will cause state changes from preceeding tasks to be lost
	}

	return { action_newTask, action_updateTask, action_restartTasks, action_abortTasks };
}

module.exports = Actions;
