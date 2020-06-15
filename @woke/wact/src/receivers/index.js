const { dispatch } = require('nact');

const sink = ({ msg, state, ctx }) => (_msg, from) => {
	_msg.type = 'sink';
	_msg.action = msg.type;
	_msg.kind = state.kind; // kind of actor 
	dispatch(ctx.sender, {...msg, ..._msg}, from || ctx.self);
}

module.exports = { sink };

