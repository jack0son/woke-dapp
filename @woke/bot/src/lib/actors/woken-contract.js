const { contract, Web3 } = require('../../actors');
const loadContract = require('../contracts').load;

function create_woken_contract_actor(director, opts) {
	const MAX_ATTEMPTS = opts && opts.maxAttempts || 5;
	const RETRY_DELAY = opts && opts.retryDelay || 3000;

	console.log(`No web3 actor provided, initialising my own...`)
	const a_web3 = director.start_actor('web3', Web3(undefined, MAX_ATTEMPTS, {
		retryDelay: RETRY_DELAY,
	}));

	// Initialise Woken Contract agent
	const a_wokenContract = director.start_actor('woken_contract', contract, {
		a_web3, 
		contractInterface: loadContract('WokeToken'),
	})

	return a_wokenContract;
}

module.exports = { create_woken_contract_actor };
