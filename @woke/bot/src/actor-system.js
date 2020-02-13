const { start, dispatch, stop, spawn, spawnStateless } = require('nact');

actors = require('./actors');

const route_action = (module, state, msg, context) => {
	let action = module[msg.type];
	if (action && typeof (action) == "function") {
		const nextState = action(msg, context, state);
		return nextState !== undefined ? nextState : state;
	}
	else {
		console.warn(`${context.name} ignored unknown message:`, msg);
		return state;
	}
}

const start_actor = (_parent, _name, _module, _initialState = {}) => {
	return spawn(
		_parent,
		(state, msg, context) => {
			return route_action(_module, state, msg, context)
		},
		_name,
		_initialState
	);
}

const system = start();

const dummyActor = {
	'print': (msg, ctx, state) => {
		// Sent WOKENS to the top three on the leaderboard
		console.log('DUMMY: ', msg.msg);
	}
}

const poll = start_actor(system, 'poller', actors.polling, {halt: false});
const dummy = start_actor(system, 'dummy', dummyActor, {});

dispatch(poll, {type: 'poll',
	target: dummy,
	action: 'print',
	period: 1000,
	args: {
		msg: 'hello'
	},
});
