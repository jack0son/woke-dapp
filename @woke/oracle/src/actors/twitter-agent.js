const { dispatch } = require('nact');
const { Logger } = require('@woke/lib');
const { receivers } = require('@woke/wact');

function TwitterAgent(twitterStub) {
	return {
		properties: {
			initialState: {
				twitter: twitterStub,
			},

			// Receivers are bound the message bundle and attached to the context
			receivers: (bundle) => ({
				// Standard response message format
				sink: receivers.sink(bundle),
			}),

			onCrash: async (msg, error, ctx) => {
				const { type, a_polling } = msg;

				switch(type) {
					case 'find': {
						// @fix this error isn't handled
						// Error: HTTP Error: 503 Service Temporarily Unavailable
						if(a_polling) dispatch(a_polling, { type: 'interupt' });
						return retry(msg, error, ctx);
					}

					default: {
						return ctx.stop;
					}
				}
			}
		},

		actions: {
			find_proof_tweet: async (msg, ctx, state) => {
				const { twitter } = state;
				const { userId } = msg;

				twitter.findClaimTweet(userId).then(({tweet, userData}) => {
					ctx.receivers.sink({ userId, tweet, userData});
				}).catch(error => {
					ctx.receivers.sink({ userId, error });
				});

			},

			get_user_data: (msg, ctx, state) => {
				const { twitter } = state;
				const { userId } = msg;
				validateTwitterStub(twitter);

				twitter.getUser(userId).then(user => {
					ctx.receivers.sink({ user });
				}).catch(error => {
					ctx.receivers.sink({ error });
				});
			},
		}
	}
};

function validateTwitterStub(stub) {
	if(!stub) {
		throw new Error('No stub provided');
	}
	if(!stub.ready()) {
		throw new Error('Twitter stub not initialised');
	}
}

module.exports = TwitterAgent;
