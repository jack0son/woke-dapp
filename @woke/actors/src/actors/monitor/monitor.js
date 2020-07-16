const { ActorSystem } = require('@woke/wact');
const { query } = ActorSystem;

function action_notify(msg, ctx, state) {
	const { a_channel } = state;

	const { error, self, prefixString } = msg;

	if(self) {
	}

	const text = `${prefixString ? prefixString : ''} ${error}`;

	await query(a_channel, { type: 'post', text }, 10000);
}

const makeOnCrash() {
	let count = 0;
	return (msg, error, ctx) => {
		count++;
		console.log(error);
		dispatch(ctx.self, msg, ctx.sender);
		return ctx.resume;
	}
}

const DEFAULT_TIMEOUT = 10000;

function Monitor({ a_channel }) {
	if(!a_channel) throw new Error('Monitor must have an output channel defined');

	return {
		properties: {
			initialState: {
				a_channel: a_channel,
				timeout: DEFAULT_TIMEOUT,
			},
			onCrash: makeOnCrash(),
		},

		actions: {
			'notify': action_notify,
		},
	}
}

module.exports = Monitor;
