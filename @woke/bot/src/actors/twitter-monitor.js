const {
	ActorSystem: { dispatch },
	supervision: { exponentialRetry },
} = require('@woke/wact');
const {
	Logger,
	utils: { delay },
} = require('@woke/lib');
const { parseTweetToTip } = require('../lib/tip');
const debug = (msg, args) => Logger().name(`TMON`, `${msg.type}>> ` + args);
// Driven by polling twitter
// https://developer.twitter.com/en/docs/tweets/search/api-reference/get-search-tweets

// @returns tip

const TwitterMonitor = (twitterDomain) => {
	const retry = exponentialRetry(3);

	return {
		properties: {
			initialState: {
				twitter: twitterDomain,
				seenTips: {},

				// @TODO Tweet finality
				// i.e. a cut off status ID str so the DB can be reset
				youngest: {
					// date of last processed tweet
					date: 0,
					id: 0,
				},
			},

			onCrash: async (msg, error, ctx) => {
				const { type, a_polling } = msg;

				switch (type) {
					case 'find_tips': {
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
			find_tips: (state, msg, ctx) => {
				const { twitter, seenTips } = state;
				// @brokenwindow
				// Polling actor should not be a dependency
				const {
					a_polling,
					//time,
					//a_processor,
				} = msg;

				validateTwitterStub(twitter);
				//isActor(a_processor, 'a_processor');

				ctx.debug.d(msg, 'Finding tip tweets...');
				return twitter
					.findTips()
					.then((tipTweets) => {
						if (a_polling) dispatch(a_polling, { type: 'resume' }); // no longer rate limited

						if (tipTweets.length > 0) {
							ctx.debug.d(msg, `Found ${tipTweets.length} tip tweets`);
						}

						// @TODO sorting through tweets for valid tips belongs in the twitter
						// stub

						const newTips = tipTweets
							.filter((tweet) => {
								//console.log(tweet);
								if (seenTips[tweet.id_str] === true) {
									ctx.debug.info(msg, `Tip already seen`);
									return false;
								}
								seenTips[tweet.id_str] = true;
								return true;
							})
							.map(parseTweetToTip);

						//newTips.forEach(t=>console.log(t));

						dispatch(ctx.sender, { type: 'new_tips', tips: newTips }, ctx.self);

						return {
							...state,
							seenTips: { ...seenTips },
						};
					})
					.catch((error) => {
						//Failed to fetch tweets
						// [ { message: 'Rate limit exceeded', code: 88 } ]
						console.log('Failed to fetch tweets');
						console.error(error);
						if (error[0] && error[0].code == 88) {
							throw error;
						}
					});
			},

			seen_tips: (state, msg, ctx) => {
				const { twitter, seenTips } = state;
				const { tips } = msg;

				console.log(tips);
				ctx.debug.d(msg, `Adding ${Object.keys(tips).length} seen tweets`);

				return {
					...state,
					tips: [...seenTips, ...tips],
				};
			},

			get_user_data: (state, msg, ctx) => {
				const { twitter } = state;
				const { userId, handle } = msg;

				twitter
					.getUser(userId)
					.then((user) => {
						dispatch(ctx.sender, { type: 'user_data', user }, ctx.self);
					})
					.catch((error) => {
						dispatch(ctx.sender, { type: 'user_data', error }, ctx.self);
					});
			},

			wokeness: (state, msg, ctx) => {
				// Search for woke tweets and add their users into the leaderboard
			},

			vote: (state, msg, ctx) => {
				// Search for wokens votes
				// Daily leaderboard for most woke tweets
			},

			wokendrop: (state, msg, ctx) => {
				// Sent WOKENS to the top three on the leaderboard
			},
		},
	};
};

function validateTwitterStub(stub) {
	if (!stub) {
		throw new Error('No stub provided');
	}
	if (!stub.ready()) {
		throw new Error('Twitter stub not initialised');
	}
}

function isActor(a_actor, targetName) {
	if (!a_wokenAgent) {
		throw new Error(`No actor provided ${targetName ? `for ${targetName}` : ''}`);
	}
}

module.exports = TwitterMonitor;
