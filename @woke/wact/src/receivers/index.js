// Receivers are bound to the message bundle making common functions available
// to every action on an actor.
// @dev Receivers accept the message bundle as an object to make the actor
// defintion of receivers less verbose.
const { dispatch } = require('nact');

// @desc Standardised message response. Provides a common socket that enables
// actors to interact without deep knowledge of each other's interfaces.
// @dev Promise-like behaviour
const sink = ({ msg, state, ctx }) => (_msg, from) => {
	_msg.type = 'sink';
	_msg.action = msg.type;
	_msg.kind = state.kind; // kind of actor 
	dispatch(ctx.sender, {...msg, ..._msg}, from || ctx.self);
}

// @desc Match an incoming sink message to a handler
const matchSink = ({ msg, state, ctx }) => actor => { 
	const { kind } = msg;
	const { sinkHandlers } = state;
	let handler = sinkHandlers[actor.name];
	if(!handler) handler = sinkHandlers[kind];
	if(!handler) {
		ctx.debug.warn(msg, `No sink handler for actor ${actor.name}:${kind}>`);
		return noEffect;
	}
	return handler;
}

module.exports = { sink, matchSink };
