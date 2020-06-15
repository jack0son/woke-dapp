const { web3Tools } = require('@woke/lib');

function tweetToProofString(tweet, userData) {
	let proofString = tweet.split(' ')[0] + ' ' + tweet.split(' ')[1]
	let followersCountHex = web3Tools.utils.uInt32ToHexString(userData.followers_count);
	console.log(`Followers count: ${userData.followers_count}, ${followersCountHex}`);
	proofString += `:${followersCountHex}`;
	//debug.name(abr, `proof string: ${proofString}`);
	//debug.name(abr, `Len: ${proofString.length}`);
	console.log(`Proof string: ${proofString}`);
}

module.exports = { tweetToProofString };
