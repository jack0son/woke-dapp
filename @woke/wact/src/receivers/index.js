const { dispatch } = require('nact');

const sink = ({ msg, state, ctx }) => (_msg) => {
	_msg.type = 'sink';
	_msg.action = msg.type;
	_msg.actor = state.kind; // kind of actor 
	dispatch(ctx.sender, {...msg, ..._msg}, recipient || ctx.self);
}

module.exports = { sink };

