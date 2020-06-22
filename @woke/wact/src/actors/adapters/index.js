// Adapters are actor API interface mixins. They return an actions object that
// can be included in other actor definitions.
const { dispatch } = require('nact');
const { matchSink } = require('../../receivers');

function SinkHandler(handler, match) {
}

const noEffect = (msg, state, ctx) => state;


// @desc Call matching handler for received sink message and apply reducer if
// one is specified
// @dev Supervisor steps (return ctx.stop etc) must be handled in effects not
// sink handlers
function SinkAdapter(reducer) {
	return {
		'sink': (msg, ctx, state) => {
			const actorId = ctx.sender.id;
			return reducer ? reducer(msg, ctx, matchSink({msg, state, ctx})(ctx.sender)(msg, ctx, state))
				: matchSink({msg, state, ctx})(ctx.sender)(msg, ctx, state);
		}
	};
}

function EffectAdapter(reducer, actions) {
	function startEffects(msg, ctx, state) {
		return reducer(msg, ctx, state);
	}
}


module.exports = { SinkAdapter, EffectAdapter };
