const {
	ActorSystem: { dispatch, query },
} = require('@woke/wact');

function action_notify(state, msg, ctx) {
	const { a_channel } = state;
	const { error, self, prefixString } = msg;

	const text = `${new Date().toISOString()}:${
		prefixString ? prefixString : ''
	} ${error}\n${error.stack}`;
	ctx.debug.d(msg, `${ctx.name} sending monitoring data...`);
	dispatch(a_channel, { type: 'post_owner', text }, ctx.self);
}

function makeOnCrash() {
	let count = 0;
	return (msg, error, ctx) => {
		count++;
		console.log(error);
		//dispatch(ctx.self, msg, ctx.sender);
		return ctx.resume;
	};
}

const DEFAULT_TIMEOUT = 10000;

function Monitor({ a_channel }) {
	if (!a_channel) throw new Error('Monitor must have an output channel defined');

	return {
		properties: {
			initialState: {
				a_channel: a_channel,
				timeout: DEFAULT_TIMEOUT,
			},
			onCrash: makeOnCrash(),
		},

		actions: {
			notify: action_notify,
		},
	};
}

module.exports = Monitor;
