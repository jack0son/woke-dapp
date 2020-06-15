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
actors = require('./actors');
const { Logger } = require('@woke/lib');

const DEBUG_PREFIX = 'actor';
const FATAL_HANG_TIME = 1000*1000; //ms
const DEBUG_RECOVERY= process.env.DEBUG_RECOVERY =='true' ? true : false

function blockOld(_consumer, _msg) {
	return query(_consumer, _msg, FATAL_HANG_TIME).catch( error => {
		throw new Error(`APPLICATION HANG: blocking query timed out (${FATAL_HANG_TIME}ms). Are you sure you want temporally couple actors?`); 
	});
}

function remap_debug(_name) {
	const debug = {};
	// Remap debugger functions to prefix each with message type
	Object.entries(Logger(`${DEBUG_PREFIX}:${_name}`)).forEach(([key, val]) => {
		if(key == 'control' || key == 'log') {
			debug[key] = val;
		} else {
			debug[key] = (msg, args) => val(`${msg.type}>> ` + args)
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
			return route_action(_actionsMap, state, msg, {
				...context,
				debug: remap_debug(_name),
				receivers: bind_receivers(_properties.receivers, msg, state, context),
			})
		},
		_name,
		_properties,
	);

const spawn_persistent = (_parent, _name, _actionsMap, _initialState, _properties) => {
	if(!_properties || !_properties.persistenceKey) {
		throw new Error(`Persistent actor must define key property`);
	}
	const { persistenceKey, ...otherProperties } = _properties;

	const debug = remap_debug(_name);
	debug.control.enabledByApp = debug.control.enabled();

	let recovering = false;
	const f = debug.control.enabledByApp ? 
		(state = _initialState, msg, context) => {
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
}

// Spawn a persistent actor
// @returns persistant actor instance
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

// Instantiate a nact actor system
// @returns nact actor system and bound methods
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
