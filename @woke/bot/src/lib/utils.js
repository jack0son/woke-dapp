module.exports.delay = async (ms) => new Promise((res) => setTimeout(res, ms));

module.exports.parse_bool = (str) => {
	switch (str) {
		case 't':
		case 'T':
		case 'true':
		case true:
			return true;
		case 'f':
		case 'F':
		case 'false':
		case false:
		default:
			return false;
	}
};
