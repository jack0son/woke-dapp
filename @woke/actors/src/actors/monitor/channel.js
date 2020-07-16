const { ActorSystem: { dispatch } } = require('@woke/wact');

function Channel({ actor, postActionName }) {
	if(!actor) throw new Error('Must provide actor');
	if(!postActionName) throw new Error('Must provide action name');

	function action_post(msg, ctx, state) {
		const { text } =  msg;
		dispatch(actor, { type: postActionName, text }, ctx.sender);
	}

	return {
		properties: {
		},
		actions: {
			'post_private': action_post,
		}
	}
}

module.exports = Channel;
