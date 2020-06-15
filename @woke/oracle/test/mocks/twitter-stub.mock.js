const users = require('./users')(Array(10).fill('0x0'));

const usersById = {};
Object.values(users).forEach(user => usersById[user.id] = user);

const createMockClient = (usersMap = users) => {
	const usersById = {};
	Object.values(usersMap).forEach(user => usersById[user.id] = user);
	return {
		initClient: async () => true,
		getUserData: (id) => {
			let user = usersById[id];
			return new Promise((resolve, reject) => user ? resolve(user) : reject(new Error('User not found')));
		},
		searchClaimTweets: (handle) => new Promise((resolve, reject) => {
			setTimeout(() => resolve(users[handle].claimString), 1000)
		})
	}
}

module.exports = { createMockClient };
