const { receivers: { sink } } = require('@woke/wact');

module.exports = {
	initialState: {
		sinks: [],
		kind: 'tx',

		opts: {
			call: null,
			send: null,
		}
	},

	receivers: (bundle) => ({
		sink: sink(bundle)
	})
}
