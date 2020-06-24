const { Contract, Web3, Nonce } = require('../actors');
const { loadContract } = require('../lib/utils');

function ContractsSystem(director, contractNames, opts) {
	const defaults = {
			maxAttempts: 5,
			retryDelay: 3000,
			networkList: [],
	};
	const { maxAttempts, retryDelay, networkList } = { ...defaults, ...opts }

	console.log(`No web3 actor provided, initialising my own...`)
	const a_web3 = director.start_actor('web3', Web3(undefined, maxAttempts, {
		networkList,
		retryDelay: retryDelay,
	}));

	console.log(`No nonce actor provided, initialising my own...`)
	let a_nonce;
	if(opts && opts.persist) {
		a_nonce = director.start_persistent('nonce', Nonce, { a_web3 });
	} else {
		a_nonce = director.start_actor('nonce', Nonce, { a_web3 });
	}
	
	// @TODO supervision actor that decides what to do when web3 fatally crashes

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

module.exports = ContractsSystem;
