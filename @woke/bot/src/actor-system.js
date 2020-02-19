const {
	start,
	dispatch,
	stop,
	spawn,
	spawnStateless,
	spawnPersistent
} = require('nact');
const { Logger } = require('@woke/lib');

actors = require('./actors');

const DEBUG_PREFIX = 'actor';

const INFINITE_WAIT = 10*1000; //ms
const block = async (recipient, msg) => {
	try {
	 return await query(recipient, INFINITE_WAIT);
	} catch(error) {
		throw new Error(`APPLICATION HANG: blocking query timed out. Are you sure you want to couple actor execution?`); 
	}
}

const spawn_actor = (_parent, _name, _actionsMap, _initialState, _properties) => {
	const debug = {};

	// Remap debugger functions to prefix each with message type
	Object.entries(Logger(`${DEBUG_PREFIX}:${_name}`)).forEach(entry => {
		const [key, func] = entry;
		debug[key] = (msg, args) => func(`${msg.type}>> ` + args)
	})

	return spawn(
		_parent,
		(state = _initialState, msg, context) => {
			return route_action(_actionsMap, state, msg, {...context, debug })
		},
		_name,
		_properties,
	);
}

const spawn_peristent = (_parent, _name, _actionsMap, _initialState, _properties) => {
	if(!_properites || !_properties.persistenceKey) {
		throw new Error(`Persistent actor must define key property`);
	}
	const { persistenceKey, ...otherProperties } = _properties;
	const debug = {};

	Object.entries(Logger(`${DEBUG_PREFIX}:${_name}`)).forEach(entry => {
		const [key, func] = entry;
		debug[key] = (msg, args) => func(`${msg.type}>> ` + args)
	})

	return spawnPersistent(
		_parent,
		(state = _initialState, msg, context) => {
			return route_action(_actionsMap, state, msg, {...context, debug })
		},
		persistenceKey,
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

const start_actor = _parent => (_name, _definition, _initialState) => {
	const { actions, properties } = _definition;
	const { initialState, ...otherProperties} = properties;
	if(!actions) {
		throw new Error(`No actions defined for {${_name}} actor`);
	}

	return spawn_actor(
		_parent,
		_name,
		actions,
		{...(initialState ? initialState : {}), ..._initialState},
		otherProperties,
	);
}

const start_peristent = _persistentSystem => (_name, _definition, _initialState) => {
	const { actions, properties } = _definition;
	const { initialState, ...otherProperties} = properties;
	if(!actions) {
		throw new Error(`No actions defined for {${_name}} actor`);
	}

	return spawn_persistent(
		_persistentSystem,
		_name,
		actions,
		{...(initialState ? initialState : {}), ..._initialState},
		otherProperties,
	);
}

// @TODO Interface surface unccessarily large
const bootstrap = (_persistenceEngine) => {
	let system;
	if(_persistenceEngine) {
		system = start(configurePersistence(_persistenceEngine));
	} else {
		system = start();
	}

	return {
		start_actor: start_actor(system),
		start_persistent: _persistenceEngine ? start_persistent(system) : undefined,
		stop: () => stop(system),
		block,
		dispatch,
		system,
	}
}

module.exports = {
	bootstrap,
	spawn_actor,
	start_actor,
	start_persistent,
}

/*
function Block(parent) {
	let idx = 0;

	return function block(producer, msg) {
		const blocker = spawn(
			_parent,
			blockActor
			`_blocker-${idx++}`,
			{
				initialState: {
					consumer,
				}
			}
		);
	}
}

// Example query(

const blockActor = (msg, ctx, state) => {
	switch(msg.blocking) {
		case 'open': (msg, ctx, state) => {
			dispatch(
		},

		case 'close': (msg, ctx, state) => {
		},

		default: {
			throw new Error(`Blocking actor always expects message property 'blocking'`)
		}
	}
}
*/
