
const socketWatchDog = {
	'watch': () => {
		const { isLive, reestablish, interval } = msg;

		call this from polling actor?
	}

	'check': () => {
		if(! isLive() ) {
			reestablish();
		}
	}
}

	function initContract(web3, interface) {
		return new self.web3.eth.Contract(self.interface.abi, self.interface.networks[self.network.id].address);
	}

const ContractAgent = (contract, a_web3) => ({
	properties: {
		initialState: {
			a_web3,
			contractInterface,
			web3Instance,
		}
	},

	actions: {
		'init': async (msg, ctx, state) => {
			//const web3Instance = await query(a_web3, { type: 'get_instance' }, ctx.self);
			dispatch(a_web3, { type: 'get_instance' }, ctx.self);
		},

		'web3': async (msg, ctx, state) => {
			const { resp } = msg;
			// Web3 dispatches (ctx.sender, { type: 'web3', resp: {type: 'get_instance', web3Instance}}, ctx.self)

			if(resp.type) {
				return {
					...state,
					web3Instance,
					contract: initContract(web3Instance.web3, contractInterface),
				}
			}
		},

		'send': async (msg, ctx, state) => {
			const { contract, a_web3 } = state;
			const { method, args, opts} = msg;
			
			const callOpts = {
				...opts,
			}

			if(await query(a_web3, { type: 'isAlive' })) {
				let r = await contract.methods[method].send(callOpts);
			} else {
			}
		},

		'call': async (msg, ctx, state) => {
			const { contract } = state;
			const { method, args, opts} = msg;
			
			const callOpts = {
				...opts,
			}

			let r = await contract.methods[method].call(callOpts);
		},
	}
})
