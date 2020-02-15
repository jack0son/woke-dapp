const { dispatch } = require('nact');
const { web3Tools } = require('@woke/lib');

function initContract(web3Instance, interface) {
	return new web3.eth.Contract(self.interface.abi, self.interface.networks[self.network.id].address);
}

const ContractAgent = (contract, a_web3) => ({
	properties: {
		initialState: {
			a_web3,
			contractInterface,
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
})
