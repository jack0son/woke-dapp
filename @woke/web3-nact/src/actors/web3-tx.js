const TxActor = require('./tx');
const txActions = TxActor.actions;

function action_send(msg, ctx, state) {
	const { tx, web3Instance, nonce } = msg; 
	const sendMethod = web3Instance.web3.eth.sendTransaction;
	return txActions.action_send(msg, ctx, { ...state, sendMethod });
}

const Web3Tx = (a_web3, a_nonce) => {
	const { initialState, ..._properties } = TxActor.properties;
	return {
		properties: {
			..._properties,
			// @TODO improve merge
			initialState: {
				...initialState,
				a_web3: a_web3,
				a_nonce: a_nonce,
			},
		},

		actions: {
			'tx': txActions.action_tx,
			'reduce': txActions.action_reduce,
			'send': txActions.action_sendPreflight,
			'_send': action_send,
			'get_status': txActions.action_getStatus,
			'sink_status': txActions.action_sinkStatus,
		}
	};
}


module.exports = Web3Tx;
