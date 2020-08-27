const {
	receivers: { sink },
} = require('@woke/wact');

module.exports = {
	initialState: {
		sinks: [],
		kind: 'tx',

		opts: {
			call: null,
			send: null,
		},
	},

	receivers: [sink],
	Receivers: (bundle) => ({
		sink: sink(bundle),
	}),
};
