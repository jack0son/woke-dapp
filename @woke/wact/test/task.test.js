const assert = require('assert');
const { TaskSupervisor } = require('../src/actors');
const { bootstrap, start_actor } = require('../src/actor-system');
const { matchEffects, subsumeEffects, Pattern } = require('../src/reducers');
const { dispatch } = require('nact');

const {
	Statuses: { TaskStatuses: Statuses },
} = TaskSupervisor;

// Simple sequential task with some async stages
const Task = (task, _supervisor) => {
	const WORK_TIME = 10;
	const do_work = (_, ctx, state) => {
		setTimeout(() => dispatch(ctx.self, { type: 'work' }, ctx.self), WORK_TIME);
		return state;
	};

	const effect_pending = (_, ctx, state) => {
		const { supervisor, task } = state;
		dispatch(
			supervisor,
			{ type: 'update', task: { ...task, status: Statuses.pending } },
			ctx.self
		);
		return do_work(_, ctx, state);
	};

	const effect_done = (_, ctx, state) => {
		const { supervisor, task } = state;
		dispatch(
			supervisor,
			{ type: 'update', task: { ...task, status: Statuses.done } },
			ctx.self
		);
		return state;
	};

	const patterns = [
		Pattern(
			({ a, b, c }) => !a && !b && !c, // predicate
			(_, ctx, state) => ({ ...effect_pending(_, ctx, state), a: true }) // effect
		),
		Pattern(
			({ a, b }) => !!a && !b,
			(_, ctx, state) => ({ ...do_work(_, ctx, state), b: true })
		),
		Pattern(
			({ b, c }) => !!b && !c,
			(_, ctx, state) => ({ ...effect_done(_, ctx, state), c: true })
		),
	];

	// Swap out for tracing
	function action_logWork(msg, ctx, state) {
		console.log(state);
		const next = matchEffects(patterns)(msg, ctx, state);
		console.log(next);
		return next;
	}

	return {
		properties: {
			initialState: {
				task,
				supervisor: _supervisor,
			},
		},
		actions: {
			work: matchEffects(patterns),
		},
	};
};

function Supervisor(_effects, makeTask = Task) {
	const getId = (t) => t.foreginId;
	const isValidTask = (t) => !!t.foreginId;

	let idx = 1;
	const makeTaskName = (i) => `task-${(idx++).toString().padStart(3, '0')}`;

	// Receiver
	const start_task = ({ msg, ctx, state }) => (task) => {
		const a_task = start_actor(ctx.self)(makeTaskName(), makeTask(task, ctx.self), {});
		dispatch(a_task, { type: 'work' }, ctx.self);
		ctx.debug.d(msg, `Started task: ${task.taskId}`);
	};

	const reportStatus = ({ task }) => {
		console.log(`taskId:${getId(task)}: triggered effect:${task.status.toString()}`);
		return true;
	};

	// Wrap effects with status report and overwrite provided effects
	const effects = Object.values(Statuses).reduce(
		(r, status) => {
			const effect = r[status];

			return {
				...r,
				[status]: effect
					? (msg, ctx, state) =>
							reportStatus(msg) && (effect ? effect(msg, ctx, state) : state)
					: reportStatus,
			};
		},
		{
			[Statuses.ready]: (msg, ctx, state) => {
				const { task } = msg;
				ctx.receivers.start_task(task);
			},
			..._effects,
		}
	);

	const actions = TaskSupervisor.Actions(getId, isValidTask, { effects });

	// Fill the supervisor state with some failed or hanging tasks
	function action_mockRecovery(msg, ctx, state) {
		const { taskRepo, tasksByStatus } = state;
		const { tasks } = msg;

		tasks.forEach((task) => {
			if (isValidTask(task)) {
				taskRepo.set(task.taskId, task);
				tasksByStatus[task.status].set(task.taskId, task);
			} else {
				throw new Error(
					`Filling supervisor memory with invalid task objects makes this test meaningless`
				);
			}
		});

		return { ...state, taskRepo, tasksByStatus };
	}

	return {
		properties: {
			...TaskSupervisor.Properties(),
			receivers: (bundle) => ({
				start_task: start_task(bundle),
			}),
		},

		actions: {
			submit: actions.action_newTask,
			update: actions.action_updateTask,
			restart: actions.action_restartTasks,
			abort: actions.action_abortTasks,
			recovery: action_mockRecovery,
		},
	};
}

context('TaskSupervisor', function() {
	let director, a_supervisor, a_stub; // actor instances

	beforeEach(function start_actors(done) {
		director = bootstrap();
		done();
	});

	afterEach(function stop_actors() {
		director.stop();
	});

	describe('Task', function() {
		it('should start a task', function(done) {
			const effects = {
				[Statuses.done]: () => done(),
			};

			a_supervisor = director.start_actor('supervisor', Supervisor(effects));
			dispatch(a_supervisor, {
				type: 'submit',
				task: { foreginId: '00001', recipient: 'jack' },
			});
		});

		it('should restart tasks after recovery', async function() {
			const tasks = [
				{
					taskId: '00001',
					foreginId: '00001',
					status: Statuses.ready,
					resolve: () => true,
				},
				{
					taskId: '00002',
					foreginId: '00002',
					status: Statuses.init,
					resolve: () => true,
				},
				{
					taskId: '00003',
					foreginId: '00003',
					status: Statuses.pending,
					resolve: () => true,
				},
			];

			const complete = tasks.map((task) => new Promise(task.resolve));

			const effects = {
				[Statuses.done]: ({ task: { taskId } }, ctx, state) => {
					state.taskRepo.get(taskId).resolve();
					return state;
				},
			};

			a_supervisor = director.start_actor('supervisor-restart', Supervisor(effects));
			dispatch(a_supervisor, { type: 'recovery', tasks });
			dispatch(a_supervisor, { type: 'restart' });

			await Promise.all(complete);

			return;
		});
	});
});
