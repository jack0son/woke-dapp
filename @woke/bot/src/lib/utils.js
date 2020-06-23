module.exports.delay = async (ms) => new Promise(res => setTimeout(res, ms));

module.exports.parse_bool = str => {
	switch(str) {
		case 't':
		case 'T':
		case 'true': return true;
		case 'f':
		case 'F':
		case 'false': 
		default: return false;
	}
}
