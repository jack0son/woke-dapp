const { dispatch } = require('nact');
const { Logger } = require('@woke/lib');
const debug = (msg, args) => Logger().name(`TMON`, `${msg.type}>> ` + args);
// Driven by polling twitter
// https://developer.twitter.com/en/docs/tweets/search/api-reference/get-search-tweets
//
//	Twitter tipping
//	---------------
//	A wokelord is able to send transactions from their wallet simply by sending
//	a tweet that matches the transfer tweet pattern. e.g.
//			+1000 WOKE
//			+1000 wokens
//			+1000W
//			+1000 WOKENS
//			+<integer> [#]<[woke, wokens, WOKE, WOKENS]>
//
//	Assumptions
//		- Users user must have tokens in their tipping purse 
//		- App will allocate all wokens to tipping on joining
//
//		query = "}

const twitterMonitor = (twitterStub) => ({
	properties: {
		initialState: {
			twitter: twitterStub,
			youngest: { // date of last processed tweet
				date: 0,
				id: 0,
			}
		}
	},

	actions: {
		'tip': (msg, ctx, state) => {
			const { twitter } = state;
			const {
				time,
				a_processor,
			} = msg;

			validateTwitterStub(twitter);
			isActor(a_processor, 'a_processor');

			function parseTipTweet(tweet) {
				// Extract sending user
				//
				// Extract @mentions
				//
				// What order are mentions in replies to tweets
				// @note Assume OP is listed firs in mentions array
				// Can enforce this by parsing tweet text and extracting the first or
				// last user handle
			}

			twitter.findTips().then(tipTweets => {
				tipTweets.forEach(tweet => {
				});

				if(a_wokenAgent) {
					tipTweets.forEach(t => dispatch(a_wokenAgent, {type: 'tip',
						tweet: t,
					}));
				}
			})
			// Search for tipping tweets
		},

		'process_tip': (msg, ctx, state) => {
		}

		'wokeness': (msg, ctx, state) => {
			// Search for woke tweets and add their users into the leaderboard
		},

		'vote': (msg, ctx, state) => {
			// Search for wokenes votes
			// Daily leaderboard for most woke tweets
			// Any twitter user can vote by tweeting '#WOKEVOTE'
		},

		'wokendrop': (msg, ctx, state) => {
			// Sent WOKENS to the top three on the leaderboard
		},

		seen: {
			'tweethash': 'tweetObject'
		}
	}
});

function validateTwitterStub(stub) {
	if(!stub) {
		throw new Error('No stub provided');
	}
	if(!stub.hasCredentials()) {
		throw new Error('Twitter stub has no credentials');
	}
}

function isActor(a_actor, targetName) {
	if(!a_wokenAgent) {
		throw new Error(`No actor provided ${targetName ? `for ${targetName}` : ''}`);
	}
}

module.exports = createTwitterMonitor;
