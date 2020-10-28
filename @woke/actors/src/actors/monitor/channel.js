const {
	ActorSystem: { dispatch },
} = require('@woke/wact');

function action_result(state, msg, ctx) {}

function Channel({ actor, postActionName }) {
	if (!actor) throw new Error('Must provide actor');
	if (!postActionName) throw new Error('Must provide action name');

	function action_post(state, msg, ctx) {
		const { text } = msg;
		dispatch(actor, { type: postActionName, text }, ctx.self);
	}

	return {
		properties: {},
		actions: {
			post_owner: action_post,
			// post_group: action_postGroup,

			// Sink
			// @fix does not match sink pattern
			[postActionName]: action_result,
		},
	};
}

module.exports = Channel;
