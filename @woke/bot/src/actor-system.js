const {
	start,
	dispatch,
	query,
	stop,
	spawn,
	spawnStateless,
	configurePersistence,
	spawnPersistent
} = require('nact');
actors = require('./actors');
const { Logger } = require('@woke/lib');

const DEBUG_PREFIX = 'actor';
const FATAL_HANG_TIME = 1000*1000; //ms
const DEBUG_RECOVERY= process.env.DEBUG_RECOVERY =='true' ? true : false

const block = async (_consumer, _msg) => {
	return await query(_consumer, _msg, FATAL_HANG_TIME).catch( error => {
		throw new Error(`APPLICATION HANG: blocking query timed out (${FATAL_HANG_TIME}ms). Are you sure you want temporally couple actors?`); 
	});
}

function create_debug(_name) {
	const debug = {};
	// Remap debugger functions to prefix each with message type
	Object.entries(Logger(`${DEBUG_PREFIX}:${_name}`)).forEach(entry => {
		const [key, val] = entry;
		if(key == 'control' || key == 'log') {
			debug[key] = val;
		} else {
			debug[key] = (msg, args) => val(`${msg.type}>> ` + args)
		}
	})
	return debug;
}

const spawn_actor = (_parent, _name, _actionsMap, _initialState, _properties) => {

	return spawn(
		_parent,
		(state = _initialState, msg, context) => {
			return route_action(_actionsMap, state, msg, {...context, debug: create_debug(_name) })
		},
		_name,
		_properties,
	);
}

const spawn_persistent = (_parent, _name, _actionsMap, _initialState, _properties) => {
	if(!_properties || !_properties.persistenceKey) {
		throw new Error(`Persistent actor must define key property`);
	}
	const { persistenceKey, ...otherProperties } = _properties;

	const debug = create_debug(_name);
	debug.control.enabledByApp = debug.control.enabled();

	let recovering = false;
	const f = debug.control.enabledByApp ? 
		(state = _initialState, msg, context) => {
			if(context.recovering && !recovering) {
				recovering = true;
				debug.log(`----- Recovering persisted state...`);
				if(!DEBUG_RECOVERY) {
						debug.control.disable();
				}
			} else if(recovering) {
				recovering = false;
				debug.control.enable();
				debug.log(`----- ... recovery complete.`);
			}

			return route_action(_actionsMap, state, msg, {...context, debug })
		} :
		(state = _initialState, msg, context) => {
			return route_action(_actionsMap, state, msg, {...context, debug })
		};

	return spawnPersistent(
		_parent,
		f,
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
	if(!_parent && _parent.name) {
		throw new Error(`Parent actor must be provided`);
	}
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

const start_persistent = _persistentSystem => (_name, _definition, _initialState) => {
	if(!_persistentSystem && _persistentSystem.name) {
		throw new Error(`Persistent system must be provided`);
	}
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
		system,
	}
}

module.exports = {
	bootstrap,
	block,
	spawn_actor,
	start_actor,
	start_persistent,
}
