import {WrapperError, AuthError} from './errors'
import {
	isValidBearerToken,
	isValidAccessKey,
	isValidAccessSecret,
} from './helpers'
import makeBaseClient from './base'
import makeAppMixin from './rest-app'
import makeUserMixin from './rest-user'


// ** Twitter Client Wrapper API
// @dev App methods available for app-only auth, and user auth
// @returns Twitter API wrapper methods
export default function makeWrapperClient(config) {
	const {
		accessKey, 
		accessSecret,
		//bearer_token, 
	} = config;

	// ** Auth config API
	const hasAppAuth = () => true;
	const hasUserAuth = () => ((
			isValidAccessKey(accessKey) && 
			isValidAccessSecret(accessSecret)
	) ? true : false );
	const checkAuth = (hasAuth, label) => () => {
		if(!hasAuth()) {
			throw new AuthError(`Missing authentication for ${label} API paths.`);
		}
	}

	const baseClient = makeBaseClient(config);
	let mixins = {};

	// ** Mixin Twitter API wrappers
	//		Public API
	const appApiMixin = makeAppMixin(baseClient.request, checkAuth(hasAppAuth, 'app'));
	mixins = {...appApiMixin}

	//		Private API
	if(hasUserAuth()) {
		const userApiMixin = makeUserMixin(baseClient.request, checkAuth(hasUserAuth, 'user'));
		mixins = { ...mixins, ...userApiMixin };
	}

	// ** Wrapper client interface
	return {
		hasAppAuth,
		hasUserAuth,
		...mixins,
	};
}
