const getwoketoke_id = '932596541822419000'; // Ambassador twitter account

module.exports = (accounts) => {
	const [defaultAccount, owner, oraclize_cb, claimer, stranger_a, stranger_b, unclaimed, ...rest] = accounts;
	return {
		getwoketoke: {
			account: rest[0],
			followers_count: 1000,
			handle: 'getwoketoke',
			id: getwoketoke_id
		},

		whalepanda: {
			account: claimer,
			followers_count: 300,
			handle: 'whalepanda',
			id: '10'
		},

		jack: {
			account: stranger_a,
			followers_count: 30,
			handle: 'jack',
			id: '11'
		},

		denk: {
			account: stranger_b,
			followers_count: 15,
			handle: 'denk',
			id: '12'
		}
	}
}
