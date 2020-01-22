// TODO replace claimFrame with regex
// @param  userClient: twitter client wrapper with user auth
export const findClaimTweet =  async (userClient, userId) => {
	let latestTweets = await userClient.getUserTimeline(userId);
	let latest = latestTweets[0];
	if(isClaimTweet(latest)) {
		return latest.full_text;
	} else {
		for(let tweet of latestTweets.slice(1, latestTweets.length)) {
			if(isClaimTweet(tweet)) {
				return tweet.full_text;
			}
		}
	}

	throw new Error('Could not find claim tweet');
}

function isClaimTweet(tweet) {
	// Text common to each claim string
	const CLAIM_FRAME = '0xWOKE:';
	return tweet.full_text && tweet.full_text.includes(CLAIM_FRAME);
}
