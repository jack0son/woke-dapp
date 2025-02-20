import React, { useReducer, useEffect, useCallback, useState } from 'react';
import { oAuthApi } from '../../lib/twitter';

const debug = (...args) => console.debug('twitter:', ...args);

export default function useUserSignin() {
	const [authState, dispatch] = useReducer(reducer, {
		//state: 'INIT',
		loading: false,
		requestToken: retrieveRequestToken(),
		verifierResp: null,
		credentials: retrieveUserTokens(),
		user: retrieveUser(),
	});

	const [error, setError] = useState(null);

	const haveUser = useCallback(() => validUser(authState.user), [authState.user]);
	const haveCreds = useCallback(() => validCreds(authState.credentials), [
		authState.credentials,
	]);
	const isSignedIn = useCallback(() => {
		return haveUser() && haveCreds();
	}, [haveUser, haveCreds]);

	function reducer(state, action) {
		switch (action.type) {
			case 'got-callback-response': {
				if (validUser(state.user)) {
					return state;
				}
				const { verifierResp } = action.payload;

				if (verifierResp && state.verifierResp == null) {
					return { ...state, verifierResp };
				}

				return state;
			}

			case 'got-access-tokens': {
				const { accessTokens } = action.payload;
				const user = {
					id: accessTokens.user_id, // id_str
					handle: accessTokens.screen_name,
				};

				const credentials = {
					accessKey: accessTokens.oauth_token,
					accessSecret: accessTokens.oauth_token_secret,
				};

				debug(user);
				storeUserTokens(credentials);
				storeUser(user);

				return { ...state, user, credentials };
			}

			case 'sign-out': {
				const user = { id: '', handle: '' };
				const credentials = {
					accessKey: '',
					accessSecret: '',
				};
				const requestToken = null;
				storeUserTokens(credentials);
				storeUser(user);
				storeRequestToken(requestToken);
				return { ...state, user, credentials, requestToken, verifierResp: null };
			}

			default: {
				console.warn('useTwitterSignin: undefined action, ', action);
			}
		}
	}

	async function handleStartAuth() {
		debug('twitter: Starting oAuth...');
		const requestToken = await oAuthApi.getUserRequestToken();
		if (requestToken.oauth_callback_confirmed !== 'true') {
			throw new Error('Twitter OAuth 1.0: callback confirmation failed');
		}
		storeRequestToken(requestToken.oauth_token);
		window.location.replace(oAuthApi.createUserOAuthUrl(requestToken));
	}

	function handleCallback() {
		const verifierResp = oAuthApi.catchOAuthCallback();
		console.log(verifierResp);
		if (verifierResp && nonEmptyArray(verifierResp.oauth_token)) {
			dispatch({ type: 'got-callback-response', payload: { verifierResp } });
		}
	}

	function signOut() {
		dispatch({ type: 'sign-out' });
	}

	// @dev Extract callback response params from verifier callback
	useEffect(() => {
		setError(null);
		//handleCallback();
	}, []);

	useEffect(() => {
		async function fetchAccessTokens(requestToken, verifierToken) {
			try {
				const accessTokens = await oAuthApi.getUserAccessToken(
					requestToken,
					verifierToken
				);
				dispatch({ type: 'got-access-tokens', payload: { accessTokens } });
			} catch (error) {
				console.log(error);
				setError('Error fetching user access tokens');
			}
		}

		if (authState.verifierResp && !haveUser()) {
			fetchAccessTokens(
				authState.verifierResp.oauth_token,
				authState.verifierResp.oauth_verifier
			);
		}
	}, [authState.verifierResp, haveUser]);

	return {
		handleStartAuth,
		handleOAuthCallback: handleCallback,
		signOut,
		isSignedIn,
		haveCreds,
		haveUser,
		user: authState.user,
		credentials: authState.credentials,
		error,
	};
}

function storeUserTokens(tokens) {
	// TODO if env == dev
	window.localStorage.setItem('access_key', tokens.accessKey);
	window.localStorage.setItem('access_secret', tokens.accessSecret);
}

export function retrieveUserTokens() {
	return {
		accessKey: window.localStorage.getItem('access_key'),
		accessSecret: window.localStorage.getItem('access_secret'),
	};
}

function storeRequestToken(token) {
	window.localStorage.setItem('request_token', token);
}

function retrieveRequestToken(token) {
	return window.localStorage.getItem('request_token');
}

function storeUser(user) {
	window.localStorage.setItem('user_id', user.id);
	window.localStorage.setItem('user_handle', user.handle);
}

function retrieveUser() {
	return {
		id: window.localStorage.getItem('user_id'),
		handle: window.localStorage.getItem('user_handle'),
	};
}

function refreshOAuthToken() {
	// If oauth token older than 30 seconds, delete it
}

function nonEmptyArray(str) {
	return str && str.length && str.length > 0;
}

function validUser(user) {
	return user && nonEmptyArray(user.id) && nonEmptyArray(user.handle);
}

function validCreds(creds) {
	return creds && nonEmptyArray(creds.accessKey) && nonEmptyArray(creds.accessSecret);
}
