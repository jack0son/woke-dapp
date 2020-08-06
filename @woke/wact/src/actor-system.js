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
const MessageDebugger = require('./lib/message-debugger');

// @TODO Use class instead of closure pattern for actor wrapper
// - so many being instantiated, memory is being exhausted

/**
 * Make receiver functions available to actor actions by binding them to the
 * message bundle.
 *
 * @function bind_receivers
 * @param {(Bundle) => receiver: string -> fn} receivers - Make receivers HOF
 * @param {Message} msg - Received message
 * @param {object} state - Actor state
 * @param {Context} ctx - Actor context
 * @return {receiver: string -> fn} Receivers map
 */
const bind_receivers = (receivers, msg, state, ctx) =>
	receivers ? receivers({ msg, state, ctx }) : undefined;

/**
 * Spawn a stateful actor
 *
 * @function spawn_actor
 * @param {System} _parent - Parent system
 * @param {string} _name - Actor name
 * @param {action: string -> Action} _actionsMap - Mapping of action names to functions
 * @param {object} _initialState - Actor's inital state object
 * @param {Propertiesj} _properties - Actor properties
 * @return {Actor} Actor instance
 */
const spawn_actor = (_parent, _name, _actionsMap, _initialState, _properties) =>
	spawn(
		_parent,
		(state = _initialState, msg, context) => {
			context.debug = MessageDebugger(_name); // provide debug to receiver context
			return route_action(_actionsMap, state, msg, {
				...context,
				receivers: bind_receivers(_properties.receivers, msg, state, context),
			});
		},
		_name,
		_properties
	);

/**
 * Spawn an actor which can persist its state to a storage repository
 *
 * @function spawn_actor
 * @param {System} _parent - Parent system
 * @param {string} _name - Actor name
 * @param {action: string -> Action} _actionsMap - Mapping of action names to functions
 * @param {object} _initialState - Actor's inital state object
 * @param {Propertiesj} _properties - Actor properties
 * @return {Actor} Actor instance
 */
const spawn_persistent = (
	_parent,
	_name,
	_actionsMap,
	_initialState,
	_properties
) => {
	if (!_properties || !_properties.persistenceKey) {
		throw new Error(`Persistent actor must define 'persistenceKey' property`);
	}
	const { persistenceKey, ...properties } = _properties;

	const debug = MessageDebugger(_name);
	debug.control.enabledByApp = debug.control.enabled();

	let recovering = false;
	const target = debug.control.enabledByApp
		? (state = _initialState, msg, context) => {
				context = { ...context, debug };
				if (context.recovering) {
					if (!recovering) {
						recovering = true;
						debug.log(`----- Recovering persisted state...`);
						if (!DEBUG_RECOVERY) {
							debug.control.disable();
						}
					}
				} else if (recovering) {
					recovering = false;
					if (!debug.control.enabled()) {
						debug.control.enable();
					}
					debug.log(`----- ... recovery complete.`);
				}

				return route_action(_actionsMap, state, msg, {
					...context,
					receivers: bind_receivers(_properties.receivers, msg, state, context),
				});
		  }
		: (state = _initialState, msg, context) => {
				context = { ...context, debug };
				return route_action(_actionsMap, state, msg, {
					...context,
					receivers: bind_receivers(_properties.receivers, msg, state, context),
				});
		  };

	return spawnPersistent(_parent, target, persistenceKey, _name, _properties);
};

/**
 * Pass message bundle to action handler
 *
 * @async
 * @function route_action
 * @param {action: string -> Action} _actionsMap - Mapping of action names to functions
 * @param {object} _state - Actor state
 * @param {Message} _msg - Received message
 * @param {Context} _ctx - Actor context
 * @return {Promise<state: object>} Next actor state
 */
const route_action = async (_actionsMap, _state, _msg, _ctx) => {
	let action = _actionsMap[_msg.type];
	if (action && typeof action == 'function') {
		const nextState = await action(_msg, _ctx, _state);
		return nextState !== undefined ? nextState : _state;
	} else {
		console.warn(`${_ctx.name} ignored unknown message:`, _msg);
		return _state;
	}
};

const isSystem = (_system) => !!_system && !!_system.name;

// @TODO define persistent properties
const isPersistentSystem = (_system) => isSystem(_system);

/**
 * Spawn an actor instance using an actor definition
 * @param {System} _parent - Parent system
 * @return {fn} Actor constructor
 */
function start_actor(_parent) {
	/**
	 * @param {string} _name - Actor name
	 * @param {Definition} _definition - Actor definition
	 * @param {object} _initialState - Actor's inital state object
	 * @return {Actor} Actor instance
	 */
	return (_name, _definition, _initialState) => {
		if (!isSystem(_parent)) {
			throw new Error(`Parent actor must be provided`);
		}
		const { actions, properties } = _definition;
		const { initialState, ...otherProperties } = properties;
		if (!actions) {
			throw new Error(`No actions defined for '${_name}' actor`);
		}

		return spawn_actor(
			_parent,
			_name,
			actions,
			{ ...(initialState ? initialState : {}), ..._initialState },
			otherProperties
		);
	};
}

/**
 * Spawn a persistent actor instance using an actor definition
 * @param {System} _parent - Parent system
 * @return {fn} Actor constructor
 */
const start_persistent = (_persistentSystem) => (
	_name,
	_definition,
	_initialState
) => {
	if (!isPersistentSystem(_persistentSystem)) {
		throw new Error(`Persistent system must be provided`);
	}
	const { actions, properties } = _definition;
	const { initialState, ...otherProperties } = properties;
	if (!actions) {
		throw new Error(`No actions defined for {${_name}} actor`);
	}

	return spawn_persistent(
		_persistentSystem,
		_name,
		actions,
		{ ...(initialState ? initialState : {}), ..._initialState },
		otherProperties
	);
};

/**
 * Instantiate a nact actor system
 *
 * @param {PersistenceEngine} _persistenceEngine - Persistence engine
 * @return {Director} Nact actor system with bound methods
 */
function bootstrap(_persistenceEngine) {
	const system = _persistenceEngine
		? start(configurePersistence(_persistenceEngine))
		: start();
	return {
		start_actor: start_actor(system),
		start_persistent: _persistenceEngine ? start_persistent(system) : undefined,
		stop: () => stop(system),
		system,
	};
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
};
