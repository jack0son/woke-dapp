const { dispatch } = require('nact');
const { Logger } = require('@woke/lib');
const {inspect} = require('util');
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

const iface = {
	find_tips: 'find_tips',
	seen_tips: 'seen_tips',
}

const TwitterMonitor = (twitterStub) => ({
	iface,

	properties: {
		initialState: {
			twitter: twitterStub,
			youngest: { // date of last processed tweet
				date: 0,
				id: 0,
			},
			seenTips: {},
		},

		onCrash: (msg, error, ctx) => ctx.resume,
	},

	actions: {
		[iface.find_tips]: (msg, ctx, state) => {
			const { twitter, seenTips } = state;
			const {
				//time,
				//a_processor,
			} = msg;

			validateTwitterStub(twitter);
			//isActor(a_processor, 'a_processor');

			ctx.debug.info(msg, 'Finding tip tweets...');
			return twitter.findTips().then(tipTweets => {
				if(tipTweets.length > 0) {
					ctx.debug.d(msg, `Found ${tipTweets.length} tip tweets`);
				}

				// @TODO sorting through tweets for valid tips belongs in the twitter
				// stub

				const newTips = tipTweets.filter(tweet => {
					//console.log(tweet);
					if(seenTips[tweet.id_str] === true) {
						ctx.debug.info(msg, `Tip already seen`);
						return false;
					}
					seenTips[tweet.id_str] = true;
					return true;
				}).map(tweet => ({
					id: tweet.id_str,
					fromId: tweet.user.id_str,
					fromHandle: tweet.user.screen_name,
					toId: tweet.in_reply_to_user_id_str,
					toHandle: tweet.entities.user_mentions[0].screen_name,
					amount: tweet.tip_amount,
				}));

				//newTips.forEach(t=>console.log(t));

				dispatch(ctx.sender, { type: 'new_tips', tips: newTips }, ctx.self);
				return {
					...state,
					seenTips: {...seenTips},
				}
			}).catch(error => {
				console.log('Failed to fetch tweets');
				console.error(error);
			});
		},

		[iface.seen_tips]: (msg, ctx, state) => {
			const { twitter, seenTips } = state;
			const { tips } = msg;

			console.log(tips);
			ctx.debug.d(msg, `Adding ${Object.keys(tips).length} seen tweets`);

			return {
				...state,
				tips: [...seenTips, ...tips],
			}
		},

		'get_user_data': (msg, ctx, state) => {
			const { twitter } = state;
			const { userId, handle } = msg;

			twitter.getUser(userId).then(user => {
				dispatch(ctx.sender, { type: 'user_data', user }, ctx.self);
			}).catch(error => {
				dispatch(ctx.sender, { type: 'user_data', error }, ctx.self);
			});
		},

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
	}
});

function validateTwitterStub(stub) {
	if(!stub) {
		throw new Error('No stub provided');
	}
	if(!stub.ready()) {
		throw new Error('Twitter stub not initialised');
	}
}

function isActor(a_actor, targetName) {
	if(!a_wokenAgent) {
		throw new Error(`No actor provided ${targetName ? `for ${targetName}` : ''}`);
	}
}

module.exports = TwitterMonitor;
