const waitForEvent = (_event, _from = 0, _to = 'latest') => 
  new Promise ((resolve,reject) => 
		_event({fromBlock: _from, toBlock: _to}, (err, event) => 
		//_event((err, event) => 
      err ? reject(err) : resolve(event)))
      
module.exports = {
  waitForEvent,
} 
