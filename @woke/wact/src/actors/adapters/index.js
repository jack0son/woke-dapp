const { dispatch } = require('nact');

function matchSink({ sinkHanlders }) { 
	return actor => {
		const handler = sinkHandlers[actor.name];
		if(!handler) {
			ctx.debug.warn(msg, `No applicable stages for actor ${actor.name}:${actor.id}>`);
			return noEffect;
		}
		return handler;
	}
}

function Pattern(predicate, effect) { return { predicate, effect } }

// Adapters are actor API interface mixins
// @desc Call matchin handler for received sink message and apply reducer if
// one is specified
function SinkAdapter(_reducer) {
	return {
		'sink': (msg, ctx, state) => {
			const actorId = ctx.sender.id;
			return reducer ? _reducer(msg, ctx, matchSink(state)(ctx.sender)(msg, ctx, state))
				: matchSink(state)(ctx.sender)(msg, ctx, state);
		}
	};
}

function EffectAdapter(_reducer, _actions) {
	function startEffects(msg, ctx, state) {
		return _reducer(msg, ctx, state);
	}
}


module.exports = { SinkAdapter, EffectAdapter, Pattern };
