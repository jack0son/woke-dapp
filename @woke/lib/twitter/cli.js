// Quickly grab twitter data form the command line
const debug = require('../debug')('twitter:cli');
const fs = require('fs');
const client = require('./client');

if (debug.control.enabled && require.main === module) {
	//var argv = require('minimist')(process.argv.slice(2));
	var argv = process.argv.slice(2);
	const [command, ...args] = argv;
	debug.d(`Command: ${command}`);
	debug.d(`Args: ${args}`);

	(async () => {
		await client.init();
		//let r = await findClaimTweet(handle);
		try {
			switch (command) {
				case 'user': {
					const [userId] = args;
					console.log(userId);
					let r = await client.getUserData(userId);
					//debug.d(`Found tweet: ${r}`);
					console.dir(r);
					break;
				}

				case 'get': {
					const [tweetId] = args;
					let r = await client.getStatus(tweetId);
					//r = r.filter(t => t.retweeted_status);
					console.dir(r, { depth: 10 });
					break;
				}

				case 'search': {
					const [query] = args;
					let r = await client.searchTweets(query ? { q: query } : undefined);
					//r = r.filter(t => t.retweeted_status);
					r.forEach((t) => {
						console.log(statusUrl(t));
						console.log(t.user.screen_name);
						console.log(t.full_text);
						console.log(t.entities.user_mentions);
						console.log('retweeted', t.retweeted_status);
						//console.log(t);
						console.log();
					});
					//console.dir(r);
					break;
				}

				case 'tips': {
					const [time] = args;
					let r = await client.searchTweets({ q: '$woke OR $WOKE OR $WOKENS OR WOKENS' });
					r = r.filter((t) => t.full_text.includes('+'));
					r.forEach((t) => {
						console.log(statusUrl(t));
						console.log('handle: ', t.user.screen_name);
						console.log(t.full_text);
						console.log();
					});

					fs.writeFileSync('tweets-tips.json', JSON.stringify(r));
					break;
				}

				case 'status': {
					const [text] = args;
					const defaultText = 'test tweet';

					let r = await client.updateStatus(text ? text : defaultText);
					console.log(r);
					break;
				}

				case 'dm': {
					const [recipient, text] = args;
					const defaultText = 'test dm';

					let r = await client.directMessage(recipient, text ? text : defaultText);
					console.log(r);
					break;
				}

				case 'tweet': {
					const [text] = args;
					const defaultText = 'cheep cheep';

					let r = await client.updateStatus(text || defaultText);
					console.log(r);
					break;
				}

				default: {
				}

				case 'claim': {
					const [handle] = args;
					let r = await client.searchClaimTweets(handle);
					r.forEach((t) => {
						console.log(t);
						console.log(t.full_text);
						console.log(t.entities.user_mentions);
						console.log();
					});
					break;
				}
			}
		} catch (error) {
			console.error(error);
		}
		return;
	})();
}
