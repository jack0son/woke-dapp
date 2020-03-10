const { dispatch, query } = require('nact');
const { Logger } = require('@woke/lib');
const debug = (msg, args) => Logger('polling').name(`info:`, `${msg.type}>> ` + args);

const iface = {
	poll: 'poll',
}

const pollingActor = {
	iface, 

	properties: {
		initialState: {
			halt: false,
			blockTimeout: null,

		},

		onCrash: (msg, error, ctx) => {
			console.log('Polling actor crashed...');
			console.log(error);
			console.log(ctx.self);
			console.log();
			switch(msg.type) {
				case 'perform':
					dispatch(ctx.self, msg, ctx.sender);
					return ctx.resume;

				default:
					return ctx.stop;
			}
		}
	},

	actions: {
		[iface.poll]: (msg, ctx, state) => {
			const {
				target, // target actor
				action, // target action type
				period, // how often to poll
				blockTimeout,
				rateLimit,
				args
			} = msg;

			if(!period || period < 0) {
				throw new Error('Polling period must be non-zero');
			}

			debug(msg, `Start ${blockTimeout ? 'sync-' : ''}polling {${target.name}:${action}} every ${period}ms...`);
			const performMessage = { type: 'perform',  target, period, action, args, impetus: ctx.sender };
			dispatch(ctx.self, performMessage, ctx.sender);

			// @brokenwindow
			// @TODO wasting memory
			return { ...state,
				halt: false,
				blockTimeout,
				period,
				target,
				action,
				currentAction: performMessage,
			}
		},

		'perform': async (msg, ctx, state) => {
			const { halt, blockTimeout } = state;
			const { target, action, period, args } = msg;

			debug(msg, `Peforming {${target.name}:${action}} ...`);
			if(!halt) {
				if(blockTimeout) {
					console.log('QUERY');
					//await query(target, {type: action, sender: ctx.sender, ...args}, blockTimeout)
					await query(target, {type: action, ...args}, blockTimeout)
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
