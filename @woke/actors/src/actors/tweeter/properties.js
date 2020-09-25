const {
	supervision: { exponentialRetry },
} = require('@woke/wact');

// @TODO add to error directory on notion
// Twitter error response:
// { errors: [ { code: 187, message: 'Status is a duplicate.' } ] }

// @brokenwindow this should be initialised at actor spawning
const retry = exponentialRetry(100);

const retryDaily = exponentialRetry(1000);

function onCrash(msg, error, ctx) {
	const twitterError = error[0];

	if (!(twitterError && twitterError.code)) {
		console.log('Invalid twitter error: ', error);
		return ctx.resume;
	}

	switch (twitterError.code) {
		case 32:
			console.log('--------- Not Authenticated ---------');
			console.log(msg, error);
			return ctx.stop;

		case 326:
			console.log('--------- Twitter Account locked ---------');
			console.log(msg, error);
			return ctx.stop;
		case 226: // flagged for spam
			console.log('--------- Flagged as spam ---------');
			console.log(msg, error);
			return ctx.stop;

		case 131: // internal error - http 500
		case 88: // rate limit exceeded
			return retry(msg, error, ctx);

		case 185: // User is over daily status update limit
			return retryDaily(msg, error, ctx);

		default:
			console.log('Unknown twitter error: ', error);
			dispatch(ctx.sender, { type: msg.type, error }, ctx.self);
		case 187: // status is a duplicate
			console.log(msg, error);
			if (msg.i_want_the_error) {
				dispatch(msg.i_want_the_error, { type: msg.type, error }, ctx.self);
			}
			return ctx.resume;
	}
}

function Properties(twitterDomain) {
	return {
		initialState: {
			twitterDomain,
		},
		onCrash,
	};
}

module.exports = Properties;
