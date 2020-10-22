const {
	web3Tools: {
		utils: { getEvents },
	},
} = require('@woke/lib');

module.exports = (wokeToken) => {
	const getTokenSupply = (_opts) => {
		let opts = {
			..._opts,
			//from: account
		};
		return wokeToken.methods.totalSupply().call(opts);
	};

	const getSummonedEvents = () => {
		return getEvents(wokeToken)('Summoned', {});
	};

	return {
		getTokenSupply,
		getSummonedEvents,
	};
};
