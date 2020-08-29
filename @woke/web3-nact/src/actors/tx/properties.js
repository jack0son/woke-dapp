const {
	receivers: { sink },
} = require('@woke/wact');

function ActorDirectory() {
	return new Map();
}

function Properties() {
	function initialStateFunc(ctx) {
		const actorDirectory = ActorDirectory();
		actorDirectory.set(ctx.self);
	}
}

const MAX_ATTEMPTS = 4;
const Properties = (a_web3, a_nonce) => ({
	initialState: {
		sinks: [],
		kind: 'tx',
		maxAttempts: MAX_ATTEMPTS,

		opts: {
			call: null,
			send: null,
		},
	},

	receivers: [sink],
	Receivers: (bundle) => ({
		sink: sink(bundle),
	}),
});

module.exports = properties;
