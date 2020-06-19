// Patterns in descending order of precedence
//const patterns = [
//	{
//		predicate: ({prop1, prop2}) => {
//			return prop1 == 'thing' && prop2;
//		},
//		effect: (msg, ctx, state) => {
//			dispatch(ctx.sender, { type: 'effect' }, ctx.self);
//
//			return {...state, stage: 'PENDING'};
//		},
//	},
//];

// 1. actor receives message that mutates state
// 2. actor applies the state mutation
// 3. actor calls reduce
// 4. reduce checks applies predicates to the new state and returns effects

const noEffect = (msg, ctx, state) => state;

function Pattern(predicate, effect) { return { predicate, effect } }

// Apply last effect in patterns list with truthy predicate 
function subsumeReduce(patterns, _default) { return (msg, ctx, state) => {
		return { ...state, ...patterns.reduce(
			(effect, pattern) => pattern.predicate(state) ? pattern.effect : effect,
			_default || noEffect
		)(msg, ctx, state)
		};
	}
}

// Apply all effects that match in a sequential pipline
function reducePipe(msg, ctx, state) {
	return { ...state, ...patterns.reduce(
			(state, pattern) => pattern.predicate(state) ? pattern.effect(state) : state,
			state,
		)(msg, ctx, state)
	};
}

//function fsmReduce(msg, ctx, state) {
//}

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

module.exports = { Pattern, reduceEvent, noEffect, subsumeReduce, reducePipe };

// Use class instead of closure pattern for actor wrapper
// - so many being instantiated, memory is running out
