const assert = require('assert');
const { TaskSupervisor } = require('../src/actors');
const { bootstrap, start_actor } = require('../src/actor-system');
const { matchEffects, subsumeEffects, Pattern } = require('../src/reducers');
const { dispatch } = require('nact');

const { Statuses } = TaskSupervisor;

const Task = (task, _supervisor) => {
	const effect_init = (msg, state, ctx) => {
		const { supervisor, task } = state;
		task.status = Statuses.pending;
		dispatch(supervisor, { type: 'update', task }, ctx.self);
	};

	const patterns = [
		Pattern(({ a, b, c }) => !a && !b && !c),
		(_, __, state) => ({ ...state, a: true }),
		Pattern(({ a, b }) => !!a && !b),
		(_, __, state) => ({ ...state, b: true }),
		Pattern(({ b, c }) => !!b && !c),
		(_, __, state) => ({ ...state, c: true }),
	];

	return {
		properties: {
			initialState: {
				task,
				supervisor: _supervisor,
			},
		},
		actions: {
			start: matchEffects(patterns),
		},
	};
};

const Supervisor = () => {
	const getId = (t) => t.goopId;
	const isValidTask = (t) => !!t.goopId;

	let idx = 1;
	const makeTaskName = (i) => `task-${(idx++).toString().padStart(3, '0')}`;

	const start_task = ({ msg, ctx, state }) => (task) => {
		const a_task = start_actor(ctx.self)(makeTaskName(), Task(task, ctx.self), {});
		dispatch(a_task, { type: 'start' }, ctx.self);
		ctx.debug.d(msg, `Started task: ${task.taskId}`);
	};

	const reportStatus = (msg, ctx, state) => {
		const { task } = msg;
		console.log(`effects:${task.status}: ${getId(msg.task)}`);
	};

	const effects = Object.values(Statuses).reduce(
		(r, status) => ({ ...r, [status]: reportStatus }),
		{}
	);
	effects[Statuses.ready] = (msg, ctx, state) => {
		const { task } = msg;
		ctx.receivers.start_task(task);
	};
	const actions = TaskSupervisor.Actions(getId, isValidTask, { effects });

	return {
		properties: {
			...TaskSupervisor.properties,
			receivers: (bundle) => ({
				start_task: start_task(bundle),
			}),
		},

		actions: {
			submit: actions.actions_newTask,
			update: actions.action_updateTask,
			resume: actions.action_resumeTasks,
			abort: actions.action_abortTasks,
		},
	};
};

context('TaskSupervisor', function() {
	let director, a_supervisor, a_stub; // actor instances

	beforeEach(function start_actors(done) {
		director = bootstrap();
		a_supervisor = director.start_actor('supervisor', Supervisor());

		done();
	});

	afterEach(async function stop_actors() {
		await director.stop();
	});

	describe('Task', function() {
		it('should start a task', function() {
			dispatch(a_supervisor, {
				type: 'submit',
				task: { goopId: '00001', recipient: 'jack' },
			});
		});
	});
});
