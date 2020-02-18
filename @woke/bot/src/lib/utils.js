module.exports.delay = async (ms) => new Promise(res => setTimeout(res, ms));

module.exports.tip_str = function tip_str(tip) {
	return `@${tip.fromHandle} wishes to tip @${tip.toHandle} ${tip.amount}.WOKENS`;
}
