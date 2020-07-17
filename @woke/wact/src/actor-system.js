const {
	start,
	query,
	stop,
	spawn,
	spawnStateless,
	configurePersistence,
	spawnPersistent,
	dispatch,
} = require('nact');
const { block } = require('./lib/nact-utils');
const { Logger } = require('@woke/lib');

const DEBUG_PREFIX = 'actor';
const DEBUG_RECOVERY= process.env.DEBUG_RECOVERY =='true' ? true : false

function remap_debug(_name) {
	const debug = {};
	// Remap debugger functions to prefix each with message type
	Object.entries(Logger(`${DEBUG_PREFIX}:${_name}`)).forEach(([key, val]) => {
		if(key == 'control' || key == 'log') {
			debug[key] = val;
		} else {
			debug[key] = (msg, args) => val(`${msg.type} >> ` + args)
		}
	})
	return debug;
}

// Make receiver functions available to the actions by binding them to the
// message bundle.
// @returns Map string -> function
const bind_receivers = (receivers, msg, state, ctx) => receivers ?
	receivers({ msg, state, ctx })
	: undefined;

const spawn_actor = (_parent, _name, _actionsMap, _initialState, _properties) =>
	spawn(
		_parent,
		(state = _initialState, msg, context) => {
			context.debug = remap_debug(_name);
			return route_action(_actionsMap, state, msg, {
				...context,
				receivers: bind_receivers(_properties.receivers, msg, state, context),
			})
		},
		_name,
		_properties,
	);

const spawn_persistent = (_parent, _name, _actionsMap, _initialState, _properties) => {
	if(!_properties || !_properties.persistenceKey) {
		throw new Error(`Persistent actor must define 'persistenceKey' property`);
	}
	const { persistenceKey, ...otherProperties } = _properties;

	const debug = remap_debug(_name);
	debug.control.enabledByApp = debug.control.enabled();

	let recovering = false;
	const target = debug.control.enabledByApp ? 
		(state = _initialState, msg, context) => {
			context = {...context, debug }
			if(context.recovering) {
				if(!recovering) {
					recovering = true;
					debug.log(`----- Recovering persisted state...`);
					if(!DEBUG_RECOVERY) {
						debug.control.disable();
					}
				}
			} else if(recovering) {
				recovering = false;
				if(!debug.control.enabled()) {
					debug.control.enable();
				}
				debug.log(`----- ... recovery complete.`);
			}

			return route_action(_actionsMap, state, msg, {
				...context,
				receivers: bind_receivers(_properties.receivers, msg, state, context),
			})
		}
		: (state = _initialState, msg, context) => {
			context = {...context, debug }
			return route_action(_actionsMap, state, msg, {
				...context,
				receivers: bind_receivers(_properties.receivers, msg, state, context),
			})
		};

	return spawnPersistent(
		_parent,
		target,
		persistenceKey,
		_name,
		_properties,
	);
}

// Pass message bundle to action handler
// @returns next actor state
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

// Spawn an actor instance using an actor definition
// @returns actor instance
function start_actor(_parent) {
	return (_name, _definition, _initialState) => {
		if(!_parent && _parent.name) {
			throw new Error(`Parent actor must be provided`);
		}
		const { actions, properties } = _definition;
		const { initialState, ...otherProperties} = properties;
		if(!actions) {
			throw new Error(`No actions defined for '${_name}' actor`);
		}

		return spawn_actor(
			_parent,
			_name,
			actions,
			{...(initialState ? initialState : {}), ..._initialState},
			otherProperties,
		);
	}
}

function isPersistentSystem(_system) {
	// TODO define precise persistent properties
	return !!_system && !!_system.name;
}

// Spawn a persistent actor
// @returns persistant actor instance
const start_persistent = _persistentSystem => (_name, _definition, _initialState) => {
	if(!isPersistentSystem(_persistentSystem)) {
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

// Instantiate a nact actor system
// @returns director: nact actor system with bound methods
function bootstrap(_persistenceEngine) {
	const system = _persistenceEngine  ? start(configurePersistence(_persistenceEngine)) : start();
	return {
		start_actor: start_actor(system),
		start_persistent: _persistenceEngine ? start_persistent(system) : undefined,
		stop: () => stop(system),
		system,
	}
}

module.exports = {
	bootstrap,
	spawn_actor,
	spawnStateless,
	start_actor,
	start_persistent,
	dispatch,
	query,
	block,
}
