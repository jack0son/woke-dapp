const { dispatch } = require('nact');

const exponentialRetry = (factor) => {
	let count = 1;
	return async (msg, error, ctx) => {
		console.log(error);
		debug(msg, `Exponential retry ${ctx.self.name}:${count}`);
		// Only increment delay on several crashes
		// Should stop incrementing counter once a reliable delay is found
		if(msg._crashed) count++; 

		await delay((2**count - 1)*factor);
		msg._crashed = count;
		dispatch(ctx.self, msg, ctx.sender);
		return ctx.resume;
	};
}

module.exports = { exponentialRetry }
