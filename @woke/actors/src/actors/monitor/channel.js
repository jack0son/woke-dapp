const { ActorSystem: { dispatch } } = require('@woke/wact');

function action_result(msg, ctx, state) {
}

function Channel({ actor, postActionName }) {
	if(!actor) throw new Error('Must provide actor');
	if(!postActionName) throw new Error('Must provide action name');

	function action_post(msg, ctx, state) {
		const { text } =  msg;
		dispatch(actor, { type: postActionName, text }, ctx.self);
	}

	return {
		properties: {
		},
		actions: {
			'post_private': action_post,

			// Sink
			// @fix does not match sink pattern
			[postActionName]: action_result,
		}
	}
}

module.exports = Channel;
