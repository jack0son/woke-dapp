// common actions
const {
	ActorSystem: { dispatch },
} = require('@woke/wact');

function action_setTweeter(state, { a_tweeter }, ctx) {
	const reply = (r) => dispatch(ctx.sender, r, ctx.self);

	if (!a_tweeter) {
		dispatch();
		ctx.debug.warn(`Ignoring attempt to set new tweeter (${a_tweeter})`);
		reply(false);
		return;
	}
	reply(true);
	return { ...state, a_tweeter };
}

module.exports = { action_setTweeter };
