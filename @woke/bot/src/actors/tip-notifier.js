
const properties = {
}

function spawn_post() {
}



const notifier = {
	properties: {
		initialState: {
			twitterStub: null
		}
	},

	actions: {
		'tip': (msg, ctx, state) => {
			const { tip } = msg;

			switch(tip.status) {
				case 'settled': {
					const a_post = spawn_post(twitterStub);
					dispatch(a_post, { type: 'dm',
						recipient: tip.fromId,
						text: tip_success_message(tip),
					}, ctx.self);
					break;
				}

				case 'failed': {
					const a_post = spawn_post(twitterStub);
					dispatch(a_post, { type: 'dm',
						recipient: tip.fromId,
						text: tip_failure_message(tip),
					}, ctx.self);
					break;
				}
			}
			// Post notification to twitter
		},

		'new_user': (msg, ctx, state) => {
		},
	}
}

// Stateless
const twitterPost = {
	properties: {
	},

	actions: {
		'dm': async (msg, ctx, state) => {
			const { recipient, text, type } = msg;
			if(type == 'welcome') {
				// Send welcome message
			}

		},

		'status': (msg, ctx, state) => {
			const { text } = msg;
		}
	}
}

