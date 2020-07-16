
function Channel({ actor, postMessageName }) {
	if(!actor) throw new Error('Must provide actor');
	if(!postMessageName) throw new Error('Must provide action name');

	function action_post(msg, ctx, state) {
		const { text } =  msg;
		dispatch(actor, { type: postMessageName, text }, ctx.sender);
	}

	return {
		properties: {
		},
		actions: {
			post: action_post,
		}
	}
}

module.exports = Channel;
