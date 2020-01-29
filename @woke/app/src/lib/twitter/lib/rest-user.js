// ** Twitter API calls requiring user oAuth

// Create mixin methods for user-only (private) Twitter API
// @clientRequest: base client request method
// @checkAuth: throw error if auth not available
// @returns: user API methods interface
export default function makeUserMixin(clientRequest, checkAuth) {
	const verifyCredentials = async () => {
		checkAuth();
		const params = {
			include_entities: false,
			skip_status: true,
			include_email: false
		};

		let r = await clientRequest('account/verify_credentials', params);
		//debug(r)
		if(r.length < 1) {
			throw new Error('No account found');
		}
		return r[0];
	}

	const getUserFriendsList = async (userId, count) => {
		checkAuth();
		const countPerPage = 200;

		const params = {
			cursor: -1,
			user_id: userId,
			trim_user: false,
			//tweet_mode: 'extended',
			skip_status: true,
			inlcude_user_entities: false,
			count: countPerPage,
		};

		let r = [];
		let pages = Math.ceil(count / countPerPage) // fail safe to avoid rate limit
		while(params.cursor != 0 && pages > 0) {
			if(r.length < count) {
				let resp = await clientRequest.get('friends/list.json', params);
				if(resp.users) {
					r = [...r, ...resp.users];
				}
				params.cursor = resp.next_cursor;
				pages -= 1;
			}
		}

		if(r.length < 1) {
		}

		return r;
	}

	return {
		verifyCredentials,
		getUserFriendsList,
	}
}
