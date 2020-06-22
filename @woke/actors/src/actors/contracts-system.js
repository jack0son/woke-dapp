const { Contract, Web3, Nonce, utils: { loadContract } } = require('@woke/web3-nact');

function create_contracts_system(director, contractNames, opts) {
	const MAX_ATTEMPTS = opts && opts.maxAttempts || 5;
	const RETRY_DELAY = opts && opts.retryDelay || 3000;

	console.log(`No web3 actor provided, initialising my own...`)
	const a_web3 = director.start_actor('web3', Web3(undefined, MAX_ATTEMPTS, {
		retryDelay: RETRY_DELAY,
	}));

	console.log(`No nonce actor provided, initialising my own...`)
	let a_nonce;
	if(opts && opts.persist) {
		a_nonce = director.start_persistent('nonce', Nonce, { a_web3 });
	} else {
		a_nonce = director.start_actor('nonce', Nonce, { a_web3 });
	}

	// Initialise Woken Contract agent
	let a_contracts = {};
	contractNames.forEach(name => {
		a_contracts[name] = director.start_actor(`a_${name}`, Contract, {
			a_web3, 
			a_nonce,
			contractInterface: loadContract(name),
		})
	});

	return a_contracts;
}

module.exports = create_contracts_system;
