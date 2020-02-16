const { dispatch, query } = require('nact');
const { web3Tools } = require('@woke/lib');

function initContract(web3Instance, interface) {
	return new web3Instance.web3.eth.Contract(
		interface.abi,
		interface.networks[web3Instance.network.id].address
	);
}

const contractActor = {
	properties: {
		initialState: {
			a_web3: undefined,
			contractInterface: undefined,
			//contract,
			//web3Instance,
		}
	},

	actions: {
		'init': async (msg, ctx, state) => {
			const { web3Instance } = await query(state.a_web3, { type: 'get' }, 2000);
			const contract = initContract(web3Instance, contractInterface);

			dispatch(ctx.sender, { type: 'contract_object', contract }, ctx.self);
		},

		'send': async (msg, ctx, state) => {
			ctx.debug.d(msg, `Got call`, msg);
			const { web3Instance } = await query(state.a_web3, { type: 'get' }, 2000);
			const contract = initContract(web3Instance, state.contractInterface);
			const { method, args, opts} = msg;

			if(!Array.isArray(args)) {
				throw new Error(`Send expects parameter args to be Array`);
			}
			const sendOpts = {
				...opts,
				from: web3Instance.web3.eth.accounts[0],
			}

			//try{
			let r = await contract.methods[method](...args).send(sendOpts);
			ctx.debug.d(msg, r);

			dispatch(ctx.sender, { type: 'contract', result: r }, ctx.self);
			//} catch(error) {
			//debug(msg, error);
			//}
		},

		'call': async (msg, ctx, state) => {
			const { web3Instance } = await query(state.a_web3, { type: 'get' }, 2000);
			const contract = initContract(web3Instance, state.contractInterface);
			const { method, args, opts} = msg;

			if(!Array.isArray(args)) {
				throw new Error(`Call expects parameter args to be Array`);
			}
			const callOpts = {
				...opts,
				from: web3Instance.web3.eth.accounts[0],
			}

			//try {
			let r = await contract.methods[method](...args).call(callOpts);
			// @TODO Errors to handle
			// -- Error: Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.
			// -- TypeError: contract.methods[method] is not a function



			ctx.debug.d(msg, r);

			dispatch(ctx.sender, { type: 'contract', result: r }, ctx.self);
			//} catch(error) {
			//} catch (error) {
			//	dispatch(init
			//}
		},
	}
};

module.exports = contractActor;
