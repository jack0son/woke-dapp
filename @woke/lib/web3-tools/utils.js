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


module.exports = {
	waitForEvent, 
	waitForEventWeb3,
};
