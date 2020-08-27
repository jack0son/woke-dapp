// Receivers are bound to the message bundle making common functions available
// to every action on an actor.
// @dev Receivers accept the message bundle as an object to make the actor
// defintion of receivers less verbose.
const { dispatch } = require('nact');

/**
 * Standardised message response. Provides a common socket that enables actors
 * to interact without deep knowledge of each other's interfaces. Promise-like
 * behaviour.
 * @dev Actor must define a 'kind: string' property allowing other actors to
 * map the sink message to an action.
 *
 * @function sink
 * @param {Message} _msg - Message to dispatch
 * @param {Actor} from - Message sender
 */
const sink = ({ state, msg, ctx }) => (_msg, _from = ctx.self) =>
	dispatch(
		ctx.sender,
		{
			..._msg,
			type: 'sink',
			action: msg.type,
			kind: state.kind || 'unknown',
		},
		_from
	);

const noEffect = (state) => state;

/**
 * Map response (sink) messages from other actors to a handler
 *
 * @function matchSinkHandler
 * @param {Actor} actor - Actor reference
 * @return {Action} Handler function
 */
const matchSinkHandler = ({ state, msg, ctx }) => (actor) => {
	const { kind } = msg;
	const { sinkHandlers } = state;
	let handler = sinkHandlers[actor.name];
	if (!handler) handler = sinkHandlers[kind];
	if (!handler) {
		ctx.debug.warn(msg, `No sink handler for actor ${actor.name}:${kind}>`);
		return noEffect;
	}
	return handler;
};

module.exports = { sink, matchSinkHandler };
