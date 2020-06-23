const { dispatch } = require('nact');
//const { delay } = require('../lib/utils');

const delay = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

const terminate = (msg, err, ctx) => {
  let path = ctx.path.toString();
	console.log(`${path}: onCrash: The following error was raised when processing message %O:\n%O\nTerminating faulted actor`, msg, err);
  return ctx.stop;
};

// @param maxAttempts: optional
const exponentialRetry = (factor, maxAttempts) => {
	let count = 1;
	return async (msg, error, ctx) => {
		console.log(error);
		console.log(`Exponential retry ${ctx.self.name}:${count}`);
		// Only increment delay on several crashes
		// Should stop incrementing counter once a reliable delay is found
		if(msg._crashed) count++; 

		if(!maxAttempts || count < maxAttempts) {
			await delay((2**count - 1)*factor);
			msg._crashed = count;
			dispatch(ctx.self, msg, ctx.sender);
			return ctx.resume;
		}
		return ctx.stop;
	};
}

module.exports = { terminate, exponentialRetry }
