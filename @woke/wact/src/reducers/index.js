// Reducers receive the message bundle, apply effects then return the modified
// state. They are pure functions that must be applied last in the chain of
// functions called on a message.

const noEffect = (msg, ctx, state) => state;

function Pattern(predicate, effect) { return { predicate, effect } }

// @dev Apply last effect in patterns list with truthy predicate 
//		1. actor receives message that mutates state
//		2. actor applies the state mutation
//		3. actor calls reduce
//		4. reduce applies predicates to the new state and returns an effect result
// Patterns are listed in descending order of precedence - i.e. apply the last
// matching effect.
function subsumeReduce(patterns, _default) { return (msg, ctx, state) => {
		return { ...state, ...patterns.reduce(
			(effect, pattern) => pattern.predicate(state) ? pattern.effect : effect,
			_default || noEffect
		)(msg, ctx, state)
		};
	}
}

// Apply all matching effects in a sequential pipline
function reducePipe(msg, ctx, state) {
	return { ...state, ...patterns.reduce(
			(state, pattern) => pattern.predicate(state) ? pattern.effect(state) : state,
			state,
		)(msg, ctx, state)
	};
}

// @TODO Use class instead of closure pattern for actor wrapper
// - so many being instantiated, memory is running out

// FSM engine. FSM table defined in events table.
function reduceFSM(eventsTable) {
	return (msg, ctx, state) => {
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
}

module.exports = { Pattern, reduceFSM, noEffect, subsumeReduce, reducePipe };

