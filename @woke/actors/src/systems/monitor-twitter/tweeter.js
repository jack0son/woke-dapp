const { Properties, actions } = require('../../tweeter');
const { action_sendDirectMessage } = require('../../tweeter/actions');


module.exports = twitterStub => ({
	properties: Properties({ twitterStub }),
	actions: {
		'send_directMessage': action_sendDirectMessage,
	}
});

