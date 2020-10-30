const { Web3, Nonce } = require('../actors');

// Starts a web3 actor and nonce actor which serve as the core for any web3 based
// service.
function CoreSystem(director, opts) {
	const defaults = {
		persist: false,
		maxAttempts: 5,
		retryDelay: 3000,
		networkList: [],
	};
	const { maxAttempts, retryDelay, networkList } = { ...defaults, ...opts };

	// @TODO supervision actor that decides what to do when web3 fatally crashes
	console.log(
		`No web3 actor provided, initialising my own... on system:${director.system.name}`
	);
	const a_web3 = director.start_actor(
		'web3',
		Web3(undefined, maxAttempts, {
			networkList,
			retryDelay: retryDelay,
		})
	);

	console.log(
		`No nonce actor provided, initialising my own... on system:${director.system.name}`
	);
	let a_nonce;
	if (opts && opts.persist) {
		a_nonce = director.start_persistent('nonce', Nonce(), { a_web3 });
	} else {
		a_nonce = director.start_actor('nonce', Nonce(), { a_web3 });
	}

	// @TODO supervision actor that decides what to do when web3 fatally crashes

	return {
		a_nonce,
		a_web3,
	};
}

module.exports = CoreSystem;
