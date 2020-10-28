const usersMap = require('./users')(Array(10).fill('0x0'));

const createMockClient = (users = usersMap) => {
	const usersById = {};
	Object.values(usersMap).forEach(user => usersById[user.id] = user);

	return {
		initClient: async () => true,
		getUserData: (id) => {
			let user = usersById[id];
			return new Promise((resolve, reject) => user ? resolve(user) : reject(new Error('User not found')));
		},
		searchClaimTweets: (handle) => new Promise((resolve, reject) => {
			let user = users[handle];
			setTimeout(() => resolve(
				user && user.claimString ? [{ full_text: user.claimString }] : [],
			), 500)
		})
	}
}

module.exports = { createMockClient };
