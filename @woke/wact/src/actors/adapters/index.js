const { dispatch } = require('nact');

function SinkHandler(handler, match) {
}

const noEffect = (msg, state, ctx) => state;

function matchSink(msg, state, ctx) { 
	const { kind } = msg;
	const { sinkHandlers } = state;
	return actor => {
		let handler = sinkHandlers[actor.name];
		if(!handler) handler = sinkHandlers[kind];
		if(!handler) {
			ctx.debug.warn(msg, `No sink handler for actor ${actor.name}:${kind}>`);
			return noEffect;
		}
		return handler;
	}
}


// Adapters are actor API interface mixins
// @desc Call matchin handler for received sink message and apply reducer if
// one is specified
// @dev Supervisor steps (return ctx.stop etc) must be handled in effects not
// sink handlers
function SinkAdapter(reducer) {
	return {
		'sink': (msg, ctx, state) => {
			const actorId = ctx.sender.id;
			return reducer ? reducer(msg, ctx, matchSink(msg, state, ctx)(ctx.sender)(msg, ctx, state))
				: matchSink(msg, state, ctx)(ctx.sender)(msg, ctx, state);
		}
	};
}

function EffectAdapter(reducer, actions) {
	function startEffects(msg, ctx, state) {
		return reducer(msg, ctx, state);
	}
}


module.exports = { SinkAdapter, EffectAdapter };
