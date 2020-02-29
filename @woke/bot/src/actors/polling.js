const { dispatch, query } = require('nact');
const { Logger } = require('@woke/lib');
const debug = (msg, args) => Logger().name(`POLL:`, `${msg.type}>> ` + args);

const iface = {
	poll: 'poll',
}

const pollingActor = {
	iface, 

	properties: {
		initialState: {
			halt: false,
		}
	},

	actions: {
		[iface.poll]: (msg, ctx, state) => {
			const {
				target, // target actor
				action, // target action type
				period, // how often to poll
				blocking,
				rateLimit,
				args
			} = msg;

			if(!period || period < 0) {
				throw new Error('Polling period must be non-zero');
			}

			debug(msg, `Start polling {${target.name}:${action}} every ${period}ms...`);
			const performMessage = { type: 'perform',  target, period, action, args, impetus: ctx.sender };
			dispatch(ctx.self, performMessage, ctx.sender);

			// @brokenwindow
			// @TODO wasting memory
			return { ...state,
				halt: false,
				blocking,
				period,
				target,
				action,
				currentAction: performMessage,
			}
		},

		'perform': async (msg, ctx, state) => {
			const { halt, blocking } = state;
			const { target, action, period, args } = msg;

			if(!halt) {
				if(blocking) {
					//await query(target, {type: action, sender: ctx.sender, ...args}, blocking)
					await query(target, {type: action, ...args}, blocking)
				} else {
					dispatch(target, {type: action, ...args}, ctx.sender);
				}

				setTimeout(() => 
					dispatch(ctx.self, { type: 'perform',  target, period, action, args }, ctx.sender),
					period
				);
			}

			return state;
		},

		'resume': (msg, ctx, state) => {
			const { currentAction } = state;
			if(!currentAction) {
				throw new Error(`No action being polled`);
			}
			debug(msg, `Resuming polling of {${state.target.name}:${state.action}}`);
			dispatch(ctx.self, currentAction, currentAction.impetus);
			return { ...state, halt: false };
		},

		'interupt': (msg, ctx, state) => {
			debug(msg, `Interupting polling of {${state.target.name}:${state.action}}`);
			return { ...state, halt: true };
		},

		'stop': (msg, ctx, state) => {
			debug(msg, `Stopping polling of {${state.target.name}:${state.action}}`);
			return ctx.stop;
		}
	}
}

module.exports = pollingActor;
