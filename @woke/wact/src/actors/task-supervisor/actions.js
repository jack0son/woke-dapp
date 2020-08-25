const { dispatch } = require('../../actor-system');
const { TaskStatuses: Statuses, isStatus } = require('./statuses');
const { TaskError, EffectError } = require('./errors');

const isEffect = (effect) => effect && typeof effect === 'function';
const isReducer = (reducer) => reducer && typeof reducer === 'function';
const isVoidState = (state) => state === undefined || state === null;

// @tmp
const reportStatus = (state, msg, ctx) => {
	console.log('Report effect:\n\tstate: ', state, '\n\tmsg: ', msg);
	//console.dir(t);
	//console.log(`taskId:${getId(task)}: triggered effect:${task.status.toString()}`);
	return true;
};

const exampleEffects = {
	[Statuses.init]: () => {},
	[Statuses.failed]: () => {},
};

function Task(taskId, task) {
	return {
		...task,
		taskId,
		status: Statuses.init,
		state: null,
		error: null,
		reason: null,
	};
}

const RESTART_ON = [Statuses.init, Statuses.ready, Statuses.pending];

// Instead of merging every state update by effects
const isValidState = ({ taskRepo, tasksByStatus }) => !!taskRepo && !!tasksByStatus;

// @TODO new task function should be primary parameter
/**
 * Task manager actions
 *
 * @param {[TODO:type]} effects - [TODO:description]
 * @return {[TODO:type]} [TODO:description]
 */
function Actions(getId, isValidTask, { effects, reducer, restartOn, effect_startTask }) {
	if (!isReducer(reducer)) reducer = (state) => state;

	function action_newTask(state, msg, ctx) {
		const { taskRepo, tasksByStatus } = state;
		const { task: _task } = msg;

		const taskId = getId(_task);
		if (!isValidTask(_task)) throw new Error(`New task ${taskId} is not a valid task`);

		if (taskRepo.has(taskId)) return state;

		const task = taskRepo.set(taskId, Task(taskId, _task)).get(taskId);
		tasksByStatus[task.status].set(taskId, task);
		return action_updateTask.call(
			ctx,
			{
				...state,
				taskRepo,
			},
			{ type: msg.type, task: { ...task, status: Statuses.ready } },
			ctx
		);
	}

	async function action_updateTask(_state, _msg, ctx) {
		const { taskRepo, tasksByStatus } = _state;
		const { task: _task } = _msg;

		if (!_task) throw new Error(`action:updateTask expects msg[task]`);
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
		} else {
			ctx.debug.d(
				_msg,
				`task: ${taskId}, ${prev.status.toString()} => ${_task.status.toString()}`
			);
		}

		const task = { ...prev, ..._task };

		if (task.error) {
			ctx.debug.error(task.error);
		}

		taskRepo.set(taskId, task);
		tasksByStatus[prev.status].delete(taskId);
		tasksByStatus[task.status].set(taskId, task);
		const state = _state;
		//const state = { ..._state, taskRepo, tasksByStatus };

		const effect = effects[task.status];

		// Task actors should not reference the taskRepo
		const msg = { task: { ...task } }; // use a copy of the task
		const nextState =
			!ctx.recovering && isEffect(effect)
				? reducer.call(ctx, effect.call(ctx, state, msg, ctx))
				: reducer.call(ctx, state, msg, ctx);

		// @TODO supervisor could ensure state is preserved by adding taskRepo etc in
		// to nextState object

		if (isVoidState(nextState)) {
			return state;
		} else if (!isValidState(nextState)) {
			// @TODO Should check reducer returned state as well. For now assume reducer is correct
			throw new EffectError(
				task,
				`${
					isEffect(effect) ? 'Effect' : 'Reducer'
				} on task status ${task.status.toString()} damaged supervisor state: ${nextState}`
			);
		}

		return nextState;
	}

	// Simple restart functionality
	// Just go back to ready state
	function action_restartTasks(_state, msg, ctx) {
		const { tasksByStatus } = _state;
		const { taskId } = msg;

		// @fix action function does not now action type that identifies its calling
		// actor
		const restartMsg = (taskId) => ({
			type: 'update', // @TODO
			task: { taskId, status: Statuses.ready },
		});

		const initMsg = (taskId) => ({
			type: 'restart',
			task: { taskId, status: Statuses.init },
		});

		if (taskId) return action_updateTask.call(ctx, _state, restartMsg(taskId), ctx);

		const tasks = (restartOn || RESTART_ON).reduce((tasks, status) => {
			tasksByStatus[status].forEach((t) => {
				tasks.push(t);
			});
			return tasks;
		}, []);

		return tasks.reduce((state, task) => {
			dispatch(ctx.self, restartMsg(task.taskId), ctx.self); // queue the restart
			return {
				...state,
				...action_updateTask.call(ctx, state, initMsg(task.taskId), ctx),
			};
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
		if (taskId) return action_updateTask.call(ctx, state, abortMsg(taskId), ctx);

		//tasksByStatus[status].forEach(({taskId}) => dispatch(ctx.self, abortMsg(taskId)));
		// Abort all tasks in provided status
		return tasksByStatus[status].values.reduce(
			(state, task) => action_updateTask.call(ctx, state, abortMsg(task.taskId), ctx),
			state
		);

		// @note using reduce ties execution path for all task effects together - an
		// error will cause state changes from preceeding tasks to be lost
	}

	return { action_newTask, action_updateTask, action_restartTasks, action_abortTasks };
}

module.exports = Actions;
