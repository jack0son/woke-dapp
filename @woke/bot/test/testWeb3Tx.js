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

// web3-core-helpers/errors.js
/**
 * @file errors.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @author Marek Kotewicz <marek@parity.io>
 * @date 2017
 */

/*
"use strict";

module.exports = {
    ErrorResponse: function (result) {
        var message = !!result && !!result.error && !!result.error.message ? result.error.message : JSON.stringify(result);
        return new Error('Returned error: ' + message);
    },
    InvalidNumberOfParams: function (got, expected, method) {
        return new Error('Invalid number of parameters for "'+ method +'". Got '+ got +' expected '+ expected +'!');
    },
    InvalidConnection: function (host){
        return new Error('CONNECTION ERROR: Couldn\'t connect to node '+ host +'.');
    },
    InvalidProvider: function () {
        return new Error('Provider not set or invalid');
    },
    InvalidResponse: function (result){
        var message = !!result && !!result.error && !!result.error.message ? result.error.message : 'Invalid JSON RPC response: ' + JSON.stringify(result);
        return new Error(message);
    },
    ConnectionTimeout: function (ms){
        return new Error('CONNECTION TIMEOUT: timeout of ' + ms + ' ms achived');
    },
    RevertInstructionError: function(reason, signature) {
        var error = new Error('Your request got reverted with the following reason string: ' + reason);
        error.reason = reason;
        error.signature = signature;

        return error;
    },
    TransactionRevertInstructionError: function(reason, signature, receipt) {
        var error = new Error('Transaction has been reverted by the EVM:\n' + JSON.stringify(receipt, null, 2));
        error.reason = reason;
        error.signature = signature;
        error.receipt = receipt;

        return error;
    },
    TransactionError: function(message, receipt) {
        var error = new Error(message);
        error.receipt = receipt;

        return error;
    },
    NoContractAddressFoundError: function(receipt) {
       return this.TransactionError('The transaction receipt didn\'t contain a contract address.', receipt);
    },
    ContractCodeNotStoredError: function(receipt) {
        return this.TransactionError('The contract code couldn\'t be stored, please check your gas limit.', receipt);
    },
    TransactionRevertedWithoutReasonError: function(receipt) {
        return this.TransactionError('Transaction has been reverted by the EVM:\n' + JSON.stringify(receipt, null, 2), receipt);
    },
    TransactionOutOfGasError: function(receipt) {
        return this.TransactionError('Transaction ran out of gas. Please provide more gas:\n' + JSON.stringify(receipt, null, 2), receipt);
    }
};
*/

