const { dispatch } = require('nact');

function matchSink({ sinkHanlders }) { 
	return actor => {
		const handler = sinkHandlers[actor.id];
		if(!handler) {
			ctx.debug.warn(msg, `No applicable stages for actor ${actor.name}:${actor.id}>`);
			return noEffect;
		}
		return handler;
	}
}

function Pattern(predicate, effect) { return { predicate, effect } }

// Adapters are actor API interface mixins
function SinkAdapter(_reducer) {
	return {
		'sink': (msg, ctx, state) => {
			const actorId = ctx.sender.id;
			return _reducer(matchSink(state)(ctx.sender)(msg, ctx, state));
		}
	};
}

function EffectAdapter(_reducer, _actions) {
	function startEffects(msg, ctx, state) {
		return _reducer(msg, ctx, state);
	}
}


module.exports = { SinkAdapter, EffectAdapter, Pattern };
