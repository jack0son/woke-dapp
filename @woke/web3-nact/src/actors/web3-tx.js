const TxActor = require('./tx');
const { adaptCompose } = require('@woke/wact');

function action_send(state, msg, ctx) {
	const { tx, web3Instance, nonce } = msg;
	const sendMethod = web3Instance.web3.eth.sendTransaction;
	// @NB Not sending a method, simply composing from another actor's function
	return TxActor.actions.action_send({ ...state, sendMethod }, msg, ctx);
}

const Web3Tx = (a_web3, a_nonce) => {
	const definition = {
		actions: {
			action_send,
		},
	};

	return adaptCompose(definition, TxActor.actions, TxActor.Properties(a_web3, a_nonce));
};

module.exports = Web3Tx;
