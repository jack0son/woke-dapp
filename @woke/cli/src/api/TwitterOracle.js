module.exports = oracle => {
	const getTweetText = async (_userId, _opts) => {
		let opts = {
			..._opts,
			//from: account
		};
		let r = await oracle.methods.getTweetText(
			_userId
		).call(opts);
		return r;
	}

	const oracleSend = async (method, args, txOpts) => {
		/*
	let txOpts = {
		gas: self.network.gasLimit,
		gasPrice: self.network.gasPrice,
		common: self.network.defaultCommon,
	};*/
		let opts = {
			...txOpts,
			from: account
		};
		let r = await oracle.methods[method](
			...args
		).send(opts);
	}
	return {
		getTweetText,
		oracleSend,
	}
}
