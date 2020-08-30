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

			opts: {
				call: null,
				send: null,
			},
		},

		receivers: [sink, reduce, notifySinks],
		Receivers: (bundle) => ({
			sink: sink(bundle),
		}),
	};
}

module.exports = Properties;
