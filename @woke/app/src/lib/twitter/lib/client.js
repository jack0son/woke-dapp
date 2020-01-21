import {WrapperError, AuthError} from './errors'
import {
	isValidBearerToken,
	isValidAccessKey,
	isValidAccessSecret,
} from './helpers'
import makeBaseClient from './base'
import makeAppMixin from './rest-app'
import makeUserMixin from './rest-user'


function makeMixer(baseObject) {
	return (mixin) => {
		baseObject = {...baseObject, ...mixin};
	}
}

// ** Twitter Client Wrapper API
// @dev App methods available for app-only auth, and user auth
// @returns Twitter API wrapper methods
export default function makeWrapperClient(config) {
	const {
		access_key, 
		access_secret,
		//bearer_token, 
	} = config;

	// ** Auth config API
	const hasAppAuth = () => true;
	const hasUserAuth = () => ((
			isValidAccessKey(config.access_key) && 
			isValidAccessSecret(config.access_secret)
	) ? true : false );
	const checkAuth = (hasAuth, label) => () => {
		if(!hasAuth()) {
			throw new AuthError(`Missing authentication for ${label} API paths.`);
		}
	}

	const baseClient = makeBaseClient(config);
	let mixins = {};
	const mix = makeMixer(mixins);

	// ** Mixin Twitter API wrappers
	//		Public API
	const appApiMixin = makeAppMixin(baseClient.request, checkAuth(hasAppAuth, 'app'));
	mix(appApiMixin);
	//mixins = {...appApiMixin}

	//		Private API
	if(hasUserAuth()) {
		const userApiMixin = makeUserMixin(baseClient.request, checkAuth(hasUserAuth, 'user'));
		mix(...mixins, ...userApiMixin);
		//mixins = {...mixins, ...userApiMixin}
	}

	// ** Wrapper client interface
	return {
		hasAppAuth,
		hasUserAuth,
		...mixins,
	}
}



