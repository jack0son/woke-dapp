const {
	receivers: { sink },
} = require('@woke/wact');
const config = require('./config');
const {
	_receivers: { reduce, notifySinks },
	_methods: { onCrash },
} = require('./actions');

const MAX_ATTEMPTS = 4;
function Properties(a_web3, a_nonce, getSendMethod) {
	return {
		onCrash,
		initialState: {
			a_web3,
			a_nonce,
			getSendMethod,
			sinks: [],
			kind: 'tx',
			maxAttempts: config.maxAttempts,
			error: null,
			failedNonce: null,

			transactionObject: null, // transaction inputs
			tx: {}, // transaction state

			opts: {
				call: null,
				send: null,
			},
		},

		receivers: [sink, reduce, notifySinks],
	};
}

module.exports = Properties;
