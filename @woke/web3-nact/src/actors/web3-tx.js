const TxActor = require('./tx');
const { compose } = require('@woke/wact');

const getSendMethod = (_, msg) => msg.web3Instance.web3.eth.sendTransaction;

const Web3Tx = (a_web3, a_nonce) => {
	const definition = {}; // additional actions and properties go here

	return compose(
		definition,
		TxActor.actions,
		TxActor.Properties(a_web3, a_nonce, getSendMethod)
	);
};

module.exports = Web3Tx;
