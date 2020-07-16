const { Properties, actions: { action_sendDirectMessage } } = require('../../actors/tweeter');


module.exports = ({ twitterStub, recipientId }) => {
	function send_dm(_msg, ctx, state) {
		const msg = { ..._msg, recipientId };
		return action_sendDirectMessage(msg, ctx, state);
	}

	return {
		properties: Properties({ twitterStub }),
		actions: {
			'send_directMessage': send_dm,
		}
	}
};


