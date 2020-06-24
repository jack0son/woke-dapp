const { ActorSystem, effects, receivers: { sink } } = require('@woke/wact');





}


const Tx = {
	properties: {
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
	},

	actions: {
		'send': action_sendPreflight,
		'_send': action_send,
		'reduce': action_reduce,
	}
}
