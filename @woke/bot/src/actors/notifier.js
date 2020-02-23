
const properties = {
}

function spawn_post() {
}

const tx_etherscan_url = tip => `https://goerli.etherscan.io/tx/${tip.tx_hash}`;
const tip_tweet_url = tip =>  `https://twitter.com/${tip.fromId}/status/${tip.id}`;

function tip_success_message(tip) {
	return `Your Wokenation of ${tip.amount} was confirmed on chain: ${tx_etherscan_url(tip)}.\n\nTransaction auth tweet ${tip_tweet_url(tip)}`;
}

function tip_failure_message(tip) {
	return `Your Wokenation of ${tip.amount} failed. Are you woke yet? Join with a tweet at https://getwoke.me`;
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
			const { recipient, text } = msg;

		},

		'status': (msg, ctx, state) => {
			const { text } = msg;
		}
	}
}

