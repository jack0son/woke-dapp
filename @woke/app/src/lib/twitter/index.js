// ** Twitter lib
import makeClient from './lib/client';
import auth from './lib/auth'

// ** API methods wrapper
// Available methods under lib/rest-user and lib/rest-app

// This should exposes interfaces
// authInterface: credentials >> << tokens
// wrapperInterface: tokens >> << apiClient
export {
	makeClient,
	auth,
}

