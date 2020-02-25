const assert = require('assert');
const expect = require('chai').use(require('chai-as-promised')).expect


const { query, dispatch } = require('nact');
const { Web3 } = require('../src/actors');
const bootstrap = require('../src/actor-system');

const Web3Actor = Web3;

const { delay } = require('../src/lib/utils');

// ## Dependencies
//  Blocked by access to web3 instance
//
// ## Spawn conditions

// ## Call
//
// Types of errors?
//
// What errors cause termination, what errors sinked
//
// Do errors get hidden by the tx actor
//
// Return param cases:

// ## Send
//
// Param error
//
// Onchain error
//
// Are errors sinked


// The focus of these tests is the flow communication flow within the web3 actor
// -- not the web3 tools
context('TxActor', function() {
	let director, a_web3;

	const web3Instance_example = Web3Mock(getId_okay)

	beforeEach(function () {
		director = bootstrap();
	})

	context('', function() {
		it('should call', function() {
		});
	})

})
