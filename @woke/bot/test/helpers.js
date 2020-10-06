const j0 = require('@woke/jack0son');
const { Collection } = require('@woke/test');

const extractRecipient = (tweet) => ({
	id: tweet.entities.user_mentions[0].id_str,
	handle: tweet.entities.user_mentions[0].screen_name,
});

const extractUser = (idx) => (user) => {
	let u = {
		...user,
		id: user.id_str,
	};
	idx[u.id] = u;
	return u;
};

// Extract user objects from our tweets pulled from twitter
const tweetsToUserIndex = (tweets) =>
	tweets.reduce((users, tweet) => {
		if (j0.notEmpty(tweet.entities.user_mentions))
			tweet.entities.user_mentions.forEach(extractUser(users));
		if (!users[tweet.user.id_str]) extractUser(users)(tweet.user);
		return users;
	}, Object.create(null));

const makeUserCollectionFromTweets = (tweets) =>
	Collection(
		Object.values(tweetsToUserIndex(tweets)).map((u) => ({
			...u,
			followers_count: u.followers_count || 15,
		}))
	);

module.exports = {
	makeUserCollectionFromTweets,
	tweetsToUserIndex,
	extractUser,
	extractRecipient,
};
