const { Logger } = require('@woke/lib');
const {
	ActorSystem: { dispatch },
	receivers,
} = require('@woke/wact');

function TwitterAgent(twitterDomain) {
	return {
		properties: {
			initialState: {
				kind: 'twitterAgent',
				twitter: twitterDomain,
			},

			// Receivers are bound the message bundle and attached to the context
			receivers: (bundle) => ({
				// Standard response message format
				sink: receivers.sink(bundle),
			}),

			onCrash: async (msg, error, ctx) => {
				const { type, a_polling } = msg;

				switch (type) {
					case 'find_proof_tweet': {
						// @fix this error isn't handled
						// Error: HTTP Error: 503 Service Temporarily Unavailable
						if (a_polling) dispatch(a_polling, { type: 'interupt' });
						return retry(msg, error, ctx);
					}

					default: {
						return ctx.stop;
					}
				}
			},
		},

		actions: {
			find_proof_tweet: (msg, ctx, state) => {
				const { twitter } = state;
				const { userId } = msg;

				return twitter
					.findClaimTweet(userId)
					.then(({ tweet, userData }) => {
						ctx.receivers.sink({ userId, tweet, userData });
					})
					.catch((error) => {
						ctx.receivers.sink({ userId, error });
					});
			},

			get_user_data: (msg, ctx, state) => {
				const { twitter } = state;
				const { userId } = msg;

				twitter
					.getUser(userId)
					.then((user) => {
						ctx.receivers.sink({ user });
					})
					.catch((error) => {
						ctx.receivers.sink({ error });
					});
			},
		},
	};
}

function validateTwitterDomain(stub) {
	if (!stub) throw new Error('No stub provided');
	if (!stub.ready()) throw new Error('Twitter stub not initialised');
}

module.exports = TwitterAgent;
