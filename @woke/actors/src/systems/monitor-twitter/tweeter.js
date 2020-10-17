const {
	Properties,
	actions: { action_sendDirectMessage },
} = require('../../actors/tweeter');

module.exports = ({ twitterStub, recipientId }) => {
	function send_dm(state, _msg, ctx) {
		const msg = { ..._msg, recipientId };
		return action_sendDirectMessage(state, msg, ctx);
	}

	return {
		properties: Properties(twitterStub),
		actions: {
			send_directMessage: send_dm,
		},
	};
};
