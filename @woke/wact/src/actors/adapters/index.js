// Adapters are actor definition mixins. They return an actions object that
// can be included in other actor definitions.
const { dispatch } = require('nact');
const { matchSink } = require('../../receivers');

function SinkHandler(handler, match) {}

/**
 * Call matching handler for received sink message and apply reducer if
 * one is specified.
 * @dev Supervisor steps (return ctx.stop etc) must be handled in effects not
 * sink handlers.
 *
 * @param {(Bundle) => state} reducer - Reducer function
 * @return {Action} Sink action
 */
function SinkAdapter(reducer) {
	return {
		sink: (msg, ctx, state) => {
			const actorId = ctx.sender.id;
			const nextState = matchSink({ msg, state, ctx })(ctx.sender)(
				msg,
				ctx,
				state
			);
			return reducer ? reducer(msg, ctx, nextState) : nextState;
		},
	};
}

function EffectAdapter(reducer, actions) {
	function startEffects(msg, ctx, state) {
		return reducer(msg, ctx, state);
	}
}

module.exports = { SinkAdapter, EffectAdapter };
