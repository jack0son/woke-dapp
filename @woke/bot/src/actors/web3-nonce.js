const { dispatch, query } = require('nact');
const { block } = require('../actor-system');

// Keep track of the nonce
const nonceActor = {
	properties: {
		initialState: {
			a_web3: null,
			nonceRepo: {}, // address => nonce
		},

		persistenceKey: 'nonce',
	},

	actions: {
		'get_nonce': async (msg, ctx, state) => {
			const { nonceRepo } = state;
			const { failedNonce, account, network } = msg;

			if(!account || !network) {
				throw new Error('Must be provided account and network');
			}

			const resetNonce = async () => {
				const { web3Instance } = await block(state.a_web3, { type: 'get' });
				state.web3Instance = web3Instance;
				const totalConfirmed = await web3Instance.web3.eth.getTransactionCount(web3Instance.account);
				return totalConfirmed;
			}

			let entry = nonceRepo[account];
			console.log(entry);

			let nonce;
			if(failedNonce) {
				nonce = await resetNonce();
			} else if (entry && entry[network.id] != undefined ) { // nonce could be 0
				nonce =  ++entry[network.id];
			} else {
				nonce = await resetNonce();
			}
			entry = { ...entry, [network.id]: nonce }
			nonceRepo[account] = entry;

			if(ctx.persist && !ctx.recovering) {
				await ctx.persist(msg);
			}

			dispatch(ctx.sender, { type: 'nonce', nonce: nonce }, ctx.self);
			console.log(nonceRepo);
			return { ...state, nonceRepo };
		},
	}
}

module.exports = nonceActor;
