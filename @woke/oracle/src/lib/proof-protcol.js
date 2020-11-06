const { web3Tools } = require('@woke/lib');

function tweetToProofString(tweet, userData) {
	const text = tweet.full_text;
	if (!text) throw new Error(`Passed tweet object has no 'full_text' property`);

	const [fullMatch, id, signature, version] = text.match(
		/0xWOKE:(\d+),0x([a-f0-9A-F]+),(\d)/
	);
	if (!fullMatch) throw new Error('No match');
	if (!id) throw new Error('Could not extract ID');
	if (!signature || !signature.length || signature.length !== 130)
		throw new Error('Invalid signature');
	if (!version) throw new Error('Could not extract proof version');

	let proofString = signature;
	let followersCountHex = web3Tools.utils.uInt32ToHexString(userData.followers_count);
	//console.log(`Followers count: ${userData.followers_count}, ${followersCountHex}`);

	proofString += `,${version}:${followersCountHex}`;
	console.log(`Proof string: ${proofString}`);

	return proofString;
}

module.exports = { tweetToProofString };
