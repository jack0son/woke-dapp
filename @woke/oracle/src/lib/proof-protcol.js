const { web3Tools } = require('@woke/lib');

function tweetToProofString(tweet, userData) {
	const text = tweet.full_text;
	if (!text) throw new Error(`Passed tweet object has no 'full_text' property`);
	// let proofString = text.split(' ')[0] + ' ' + text.split(' ')[1];

	// const amountRegex = /\+(\d+)\s*\$/;
	const [fullMatch, id, signature] = text.match(/0xWOKE:(\d+),0x([a-f0-9]+),1/);
	// console.log({ fullMatch, id, signature });
	let proofString = signature;

	// proofString.search(
	let followersCountHex = web3Tools.utils.uInt32ToHexString(userData.followers_count);
	//console.log(`Followers count: ${userData.followers_count}, ${followersCountHex}`);
	proofString += `:${followersCountHex}`;
	//debug.name(abr, `proof string: ${proofString}`);
	//debug.name(abr, `Len: ${proofString.length}`);
	//console.log(`Proof string: ${proofString}`);
	return proofString;
}

module.exports = { tweetToProofString };
