const { query } = require('nact');

const FATAL_HANG_TIME = 1000*1000; //ms
function block(_consumer, _msg) {
	return query(_consumer, _msg, FATAL_HANG_TIME).catch( error => {
		throw new Error(`APPLICATION HANG: blocking query timed out (${FATAL_HANG_TIME}ms). Are you sure you want temporally couple actors?`); 
	});
}

module.exports = { block };
