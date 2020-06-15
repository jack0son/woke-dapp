const { dispatch } = require('nact');

const sink = ({ msg, state, ctx }) => (_msg) => {
	_msg.type = 'sink';
	_msg.action = msg.type;
	dispatch(ctx.self, {...msg, ..._msg}, recipient || ctx.sender);
}

module.exports = { sink };

