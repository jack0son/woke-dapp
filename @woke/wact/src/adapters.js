// Adapters are actor definition mixins. They return an actions object that
// can be included in other actor definitions.
const { dispatch } = require('nact');
const { matchSinkHandler } = require('./receivers');

/**
 * Call matching handler for received sink message and apply reducer if
 * one is specified.
 * @dev Supervisor steps (return ctx.stop etc) must be handled in effects not
 * sink handlers.
 *
 * @param {(Bundle) => state} reducer - Reducer function
 * @return {Action} Sink action
 */
function SinkReduce(reducer) {
	return {
		sink: (state, msg, ctx) => {
			console.log('SINK REDUCE:', state);
			const actorId = ctx.sender.id;
			const nextState = matchSinkHandler({ state, msg, ctx })(ctx.sender)(
				state,
				msg,
				ctx
			);
			return reducer ? reducer(state, msg, ctx) : nextState;
		},
	};
}

module.exports = { SinkReduce };
