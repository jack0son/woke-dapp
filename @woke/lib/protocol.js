const web3Utils = require('./web3-tools/utils');

// Generate Woke Proof String
const exampleClaimStr = '@getwoketoke 0xwoke:1224421374322,0x12312377134319222222312,1';
// message_to_sign = <address><userId><appId>
// token = '@getwoketoke 0xwoke:<userId>,<signature>,
async function genClaimString(signatory, userId, followersCount, app = 'twitter') {
	const appId = {
		'default' : 0,
		'twitter' : 10,
		'youtube' : 20,
		'reddit' : 30
	}

	let followersCountHex = web3Utils.uInt32ToHexString(followersCount);
	let msgHash = web3.utils.soliditySha3(
		{t: 'uint256', v: signatory}, 
		{t: 'string', v: userId},
		{t: 'uint8', v: appId[app]}
	).toString('hex');
	const sig = await web3.eth.sign(msgHash, signatory);

	return `@getwoketoke 0xWOKE:${userId},${sig},1:${followersCountHex}`;
}

module.exports = {
	genClaimString
};
