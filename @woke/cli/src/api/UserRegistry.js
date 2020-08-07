const { nonEmptyString, getEvents } = require('../utils');

module.exports = (userRegistry) => {
	const getUsers = async (userId) => {
		let opts = { fromBlock: 0 };
		let events = await userRegistry.getPastEvents('Claimed', opts);
		if (nonEmptyString(userId)) {
			events = events.filter((e) => e.returnValues.userId == userId);
		}

		if (events.length && events.length > 0) {
			const users = [];
			for (e of events) {
				users.push({
					...e.returnValues,
					balance: await userRegistry.methods
						.balanceOf(e.returnValues.userId)
						.call(),
				});
			}
			return users;
		}

		return null;
	};

	const getUnclaimedPool = (_opts) => {
		let opts = {
			..._opts,
			//from: account
		};
		return userRegistry.methods.balanceOf(userRegistry._address).call(opts);
	};

	const getClaimedEvents = (userRegistry) => async (
		_claimerAddress,
		_claimerId
	) => {
		/*
	let opts = {
		fromBlock: 0,
	}
	let events = await userRegistry.getPastEvents('Claimed', opts);

	if(_claimerAddress) 
		events = events.filter(e => e.returnValues.account == _claimerAddress)

	if(_claimerId) 
		events = events.filter(e => e.returnValues.userId == _claimerId)
		*/
		return getEvents(userRegistry)('Claimed', {
			account: _claimerAddress,
			userId: _claimerId,
		});

		//return events;
	};

	const getTransferEvents = async (_fromId, _toId) => {
		let opts = {
			fromBlock: 0,
			// @fix these params are not indexed in UserRegistry.sol
			//fromId: _fromId,
			//toId: _toId,
		};

		let events = await userRegistry.getPastEvents('Tx', opts);

		if (_fromId)
			events = events.filter((e) => e.returnValues.fromId == _fromId);

		if (_toId) events = events.filter((e) => e.returnValues.toId == _toId);

		return events;
	};

	const getTributeBonuses = async (_claimerAddress, _tributorAddress) => {
		let opts = {
			fromBlock: 0,
		};
		if (_claimerAddress) opts.filter.claimer = _claimerAddress;
		if (_tributorAddress) opts.filter.tributor = _tributorAddress;

		return getEvents(userRegistry)('Bonus', opts.filter);
	};

	return {
		getUsers,
		getClaimedEvents,
		getUnclaimedPool,
		getTransferEvents,
		getTributeBonuses,
	};
};
