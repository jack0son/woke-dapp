const { nonEmptyString, getEvents } = require('../utils');

module.exports = (oracle) => {
	const getTweetText = async (_userId, _opts) => {
		const opts = {
			..._opts,
			//from: account
		};
		let r = await oracle.methods.getTweetText(_userId).call(opts);
		return r;
	};

	//'FindTweetLodged'
	const getLodgedTweets = async (_userId, _opts) => {
		const filter = { userId: _userId };

		return getEvents(oracle)('FindTweetLodged', filter);
	};

	const oracleSend = async (method, args, txOpts) => {
		/*
	let txOpts = {
		gas: self.network.gasLimit,
		gasPrice: self.network.gasPrice,
		common: self.network.defaultCommon,
	};*/
		let opts = {
			...txOpts,
			from: account,
		};
		let r = await oracle.methods[method](...args).send(opts);
	};
	return {
		getTweetText,
		getLodgedTweets,
		oracleSend,
	};
};
