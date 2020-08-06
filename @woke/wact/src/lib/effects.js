// @TODO reducers replace all this functionality

// An effect behaves like a function pipeline
// -- it receives the original state of the actor as well as the latest sate
// from the previous effect or action function
// -- effects have the same function signature as an action

//'action_name': applyPostEffect(msg, ctx, state)(dispatchSinks)(action)
const applyPostEffect = (msg, ctx, state) => (effect) => (action) => {
	const nextState = action(msg, ctx, state);
	const effectState = effect(msg, ctx, nextState);
	return effectState ? effectState : nextState;
};

// @TODO this could be creating some memory inefficiencies
//	i.e. if states are being copied instead of referenced
const withEffect = (msg, ctx, state) => (action_a) => (action_b) => {
	const orig = { ...state }; // preserve original state

	const state_a = action_a(msg, ctx, state);
	const nextState = state_a ? state_a : state;

	const state_b = action_b(msg, ctx, { ...nextState, _state: orig });
	return state_b ? state_b : nextState;
};

module.exports = {
	withEffect,
};
