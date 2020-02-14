const { start, dispatch, stop, spawn, spawnStateless } = require('nact');

actors = require('./actors');

const spawn_actor = (_parent, _name, _actionsMap, _initialState, _properties) => {
	return spawn(
		_parent,
		(state = _initialState, msg, context) => {
			return route_action(_actionsMap, state, msg, context)
		},
		_name,
		_properties,
	);
}

const route_action = async (_actionsMap, _state, _msg, _context) => {
	let action = _actionsMap[_msg.type];
	if (action && typeof (action) == "function") {
		const nextState = await action(_msg, _context, _state);
		return nextState !== undefined ? nextState : _state;
	}
	else {
		console.warn(`${_context.name} ignored unknown message:`, _msg);
		return _state;
	}
}

const start_actor = system => (_name, _definition, _initialState) => {
	const { actions, properties } = _definition;
	return spawn_actor(
		system,
		_name,
		actions,
		_initialState || properties.initialState,
		properties
	);
}

const bootstrap = () => {
	const system = start();

	return {
		start_actor: start_actor(system),
		stop: () => stop(system),
		dispatch,
		system,
	}
}

module.exports = bootstrap;
