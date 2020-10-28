// ** Twitter API calls requiring app oauth

// Create mixin methods for app-only (public) Twitter API
// @clientRequest: base client request method
// @checkAuth: throw error if auth not available
// @returns: app API methods interface
export default function makeAppMixin(clientRequest, checkAuth) {
	const getUserData = async (userId, handle) => {
		checkAuth();
		const params = handle ? { screen_name: handle } : { user_id: userId };

		let userObject = await clientRequest.get('users/show.json', params);
		//let avatarSmall = userObject.profile_image_url_https;

		return {
			id: userObject.id_str,
			name: userObject.name,
			handle: userObject.screen_name,
			avatar: userObject.profile_image_url_https,
		};
	};

	const getUserTimeline = async (userId, count) => {
		checkAuth();
		const params = {
			id: userId,
			trim_user: false,
			tweet_mode: 'extended',
			inlcude_entities: false,
			exclude_replies: false,
			count: 10,
		};

		let r = await clientRequest.get('statuses/user_timeline.json', params);

		if (r.length < 1) {
			throw new Error('No tweets found');
		}

		return r;
	};

	return {
		getUserData,
		getUserTimeline,
	};
}
