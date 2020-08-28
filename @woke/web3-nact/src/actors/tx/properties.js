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

const properties = {
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

module.exports = properties;
