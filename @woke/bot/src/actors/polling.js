const { dispatch } = require('nact');
const { Logger } = require('@woke/lib');
const debug = (msg, args) => Logger().name(`POLL:`, `${msg.type}>> ` + args);

const pollingActor = {
	properties: {
		initialState: {
			halt: false,
		}
	},

	actions: {
		'poll': (msg, ctx, state) => {
			const {
				target, // target actor
				action, // target action type
				period, // how often to poll
				rateLimit,
				args
			} = msg;

			if(!period || period < 0) {
				throw new Error('Polling period must be non-zero');
			}

			debug(msg, `Start polling {${target.name}:${action}} every ${period}ms...`);
			dispatch(ctx.self, { type: 'perform',  target, action, args }, ctx.self);

			return { ...state,
				halt: false,
				period,
				target,
				action,
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
			debug(msg, `Interupting polling of {${state.target.name}:${state.action}}`);
			return {...state, halt: true}
		}
	}
}

module.exports = pollingActor;
