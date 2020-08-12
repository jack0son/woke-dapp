const twitterUsers = (twitter) => {
	const users = {};
	const getHandle = (() => {
		return async (userId) => {
			if (!users[userId]) {
				try {
					const user = await twitter.getUserData(userId);
					users[userId] = { ...user };
				} catch (error) {
					console.log('Error: twitter: ', error);
					users[userId] = 'MISSING';
				}
			}
			return users[userId];
		};
	})();

	let userIds = [];
	const addId = (id) => {
		if (!userIds.includes(id)) userIds.push(id);
	};

	return { getHandle, addId, users, userIds };
};

const fetchUserHandles = (twitterUsers) => (userIds) => {
	userIds.forEach((id) => twitterUsers.addId(id));
	//debug.d('Fetching user handles...');
	return Promise.all(twitterUsers.userIds.map((id) => twitterUsers.getHandle(id)));
};

module.exports = { twitterUsers, fetchUserHandles };
