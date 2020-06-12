import React from 'react'
import { Redirect, useLocation } from 'react-router-dom';
import Loading from './views/loading';
import { useTwitterContext } from '../hooks/twitter';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function TwitterAuth() {
	const query = useQuery();
	const { userSignin } = useTwitterContext();
	//console.log('auth', query.get('oauth_token'), query.get('oauth_verifier'));

	userSignin.handleOAuthCallback();

	return (
		userSignin.isSignedIn() || userSignin.error ? <Redirect
            to={{
              pathname: "/",
							state: { authError: userSignin.error } // unused
            }}
		/> : <Loading/>
	);
}
