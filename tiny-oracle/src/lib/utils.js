const waitForEvent = (_event, _from = 0, _to = 'latest') => 
	new Promise ((resolve,reject) => 
		_event({fromBlock: _from, toBlock: _to}, (err, event) => 
			//_event((err, event) => 
			err ? reject(err) : resolve(event)))

const waitForEventWeb3 = (_contract, _event, _from = 0, _to = 'latest') => 
	new Promise ((resolve,reject) => 
		_contract.once(_event, {}, (err, event) => //{fromBlock: _from, toBlock: _to}, (err, event) => 
			//_event((err, event) => 
			err ? reject(err) : resolve(event)))

async function genClaimString(web3, signatory, userId, app = 'twitter') {
	const appId = {
		'default' : 0,
		'twitter' : 10,
		'youtube' : 20,
		'reddit' : 30
	}

	let msgHash = web3.utils.soliditySha3(
		{t: 'uint256', v: signatory}, 
		{t: 'string', v: userId},
		{t: 'uint8', v: appId[app]}
	).toString('hex');

	const sig = await web3.eth.sign(msgHash, signatory);

	let str = `@getwoketoke 0xWOKE:${userId},${sig},1`;
	return str;
}

module.exports = {
	waitForEvent, 
	waitForEventWeb3,
	genClaimString
};
