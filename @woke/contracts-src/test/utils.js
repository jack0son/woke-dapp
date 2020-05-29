const waitForEvent = (_event, _from = 0, _to = 'latest') => 
  new Promise ((resolve,reject) => 
		_event({fromBlock: _from, toBlock: _to}, (err, event) => 
		//_event((err, event) => 
      err ? reject(err) : resolve(event)))

function genRandomUserId() {
	return getRandomInt(14, 4e12).toString();
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
      
module.exports = {
  waitForEvent,
	genRandomUserId,
} 
