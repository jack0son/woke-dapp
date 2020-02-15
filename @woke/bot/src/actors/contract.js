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
			const web3Instance = await query(a_web3, { type: 'get' }, 2000);
			const contract = initContract(web3Instance, contractInterface);

			dispatch(ctx.sender, { type: 'contract_object', contract }, ctx.self);
		},

		'send': async (msg, ctx, state) => {
			ctx.debug.d(msg, `Got call`, msg);
			const web3Instance = await query(state.a_web3, { type: 'get' }, 2000);
			const contract = initContract(web3Instance, state.contractInterface);
			const { method, args, opts} = msg;

			const sendOpts = {
				...opts,
			}

			//try{
			let r = await contract.methods[method].send(sendOpts);
			ctx.debug.d(r);

			dispatch(ctx.sender, { type: 'contract', result: r }, ctx.self);
			//} catch(error) {
			//debug(msg, error);
			//}
		},

		'call': async (msg, ctx, state) => {
			const web3Instance = await query(state.a_web3, { type: 'get' }, 2000);
			const contract = initContract(web3Instance, state.contractInterface);
			const { method, args, opts} = msg;

			const callOpts = {
				...opts,
			}

			//try {
			let r = await contract.methods[method].call(callOpts);
			ctx.debug.d(r);

			dispatch(ctx.sender, { type: 'contract', result: r }, ctx.self);
			//} catch(error) {
			//} catch (error) {
			//	dispatch(init
			//}
		},
	}
};

module.exports = contractActor;
