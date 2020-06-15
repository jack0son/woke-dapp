const { dispatch } = require('nact');
const { tip_str } = require('../lib/utils');

const properties = {
	initialState: {
		stage: 'INIT',
	},

	// Receivers are bound the message bundle and attached to the context
	receivers: (msg, state, ctx) => ({
		// Reduce forwards a message to the reduce action
		reduce: (_msg) => {
			_msg.type = 'reduce';
			dispatch(ctx.self, {...msg, ..._msg}, ctx.self);
		}
	}),

	onCrash: undefined,
}

// Subsumption state machin
// Patterns in descending order of precedence
const patterns = [
	{
		predicate: ({prop1, prop2}) => {
			return prop1 == 'thing' && prop2;
		},
		effect: (msg, ctx, state) => {
			dispatch(ctx.sender, { type: 'effect' }, ctx.self);

			return {...state, stage: 'PENDING'};
		},
	},
];

// 1. actor receives message that mutates state
// 2. actor applies the state mutation
// 3. actor calls reduce
// 4. reduce checks applies predicates to the new state and returns effects

const noEffect = (msg, ctx, state) => state;

function subsumeReduce(patterns){ return (msg, ctx, state) => {
	return { ...state, ...patterns.reduce(
		(effect, pattern) => pattern.predicate(state) ? pattern.effect : effect,
		noEffect
	)(msg, ctx, state)};
}

function fsmReduce(msg, ctx, state) {
}

// Apply all effects that match in a pipline
function reducePipe(msg, ctx, state) {
	patterns.reduce(
		(state, pattern) => pattern.predicate(state) ? pattern.effect(state) : state,
		state,
	);
}

// FSM engine. FSM table defined in events table.
function reduceEvent(msg, ctx, state) {
	const { stage } = state;
	const { event } = msg;

	ctx.debug.info(msg, `Got <${event}> in stage ╢ ${stage} ╟`);
	const applicableStages = eventsTable[event];

	if(!applicableStages) {
		ctx.debug.warn(msg, `No applicable stages for event <${event}>`);
		return state;
	}

	const action = applicableStages[stage];
	if(!action) {
		ctx.debug.warn(msg, `Event <${event}> triggers on actions in stage ╢ ${stage} ╟`);
		return state;
	}

	ctx.reduce = ctx.receivers.reduce; // convenience

	const nextState = {...state, ...action.effect(msg, ctx, state)};
	return nextState;
}

// Use class instead of closure pattern for actor wrapper
// - so many being instantiated, memory is running out


class Actor extends Receivers {
	constructor() {
	}
}

function Saga() {}

function StateMachine() {
}
