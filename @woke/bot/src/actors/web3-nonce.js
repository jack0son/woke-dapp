const { dispatch, query } = require('nact');
const { block } = require('../actor-system');

// Keep track of the nonce
const nonceActor = {
	properties: {
		persistenceKey: 'nonce',

		initialState: {
			a_web3: null,
			nonceRepo: {}, // address => nonce
		},
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

			dispatch(ctx.sender, { type: 'nonce', nonce: nonce }, ctx.self);
			dispatch(ctx.self, { type: 'set_nonce', entry, account }, ctx.self); // persist
			return { ...state, nonceRepo };
		},

		// @brokenwindow
		// If set nonce was used to change the state there would be a data race
		// between actors requesting the nonce and the nonce actor itself - nonce
		// responses could get out of order.
		//	-- for now use seperate action to duplicate message;
		'set_nonce': async (msg, ctx, state) => {
			const { entry, account } = msg;
			if(ctx.persist && !ctx.recovering) {
				await ctx.persist(msg);
			}
			return { ...state, nonceRepo: {...state.nonceRepo, [account]: entry } };
		},
	}
}

module.exports = nonceActor;
