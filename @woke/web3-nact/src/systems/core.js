const { Web3, Nonce } = require('../actors');

function CoreSystem(director, opts) {
	const defaults = {
			persist: false,
			maxAttempts: 5,
			retryDelay: 3000,
			networkList: [],
	};
	const { maxAttempts, retryDelay, networkList } = { ...defaults, ...opts }

	// @TODO supervision actor that decides what to do when web3 fatally crashes
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

	return {
		a_nonce,
		a_web3,
	}
}

module.exports = CoreSystem;
