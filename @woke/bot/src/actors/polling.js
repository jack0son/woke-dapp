const { dispatch } = require('nact');
const { Logger } = require('@woke/lib');
const debug = (msg, args) => Logger().name(`POLL:${msg.type}`, args);

const pollingService = {
	'poll': (msg, ctx, state) => {
		const {
			target, // target actor
			action, // target action type
			period, // how often to poll
			rateLimit,
			args
		} = msg;

		debug(msg, `Start polling {${target.name}:${action}} every ${period}ms...`);
		dispatch(ctx.self, { type: 'perform',  target, action, args }, ctx.self);

		return { ...state,
			halt: false,
			period
		}
	},

	'perform': (msg, ctx, state) => {
		const { halt, period } = state;
		const { target, action, args } = msg;

		if(!halt) {
			dispatch(target, {type: action, ...args});

			setTimeout(() => 
				dispatch(ctx.self, { type: 'perform',  target, action, args }),
				period
			);
		}

		return state;
	},

	'interupt': (msg, ctx, state) => {
		console.log(`Interupting polling of ${state.target}:${state.type}`);
		return {...state, halt: true}
	}
}

module.exports = pollingService;
