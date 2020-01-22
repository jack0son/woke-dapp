import React, { useReducer, useEffect, useCallback } from 'react';
import { oAuthApi } from '../../lib/twitter'

export default function useUserSignin() {
	const [authState, dispatch] = useReducer(reducer, {
		//state: 'INIT',
		loading: false,
		requestToken: retrieveRequestToken(),
		verifierResp: null,
		userTokens: retrieveUserTokens(),
		user: retrieveUser(),
	});

	const haveUser = useCallback(() => validUser(authState.user), [authState.user])
	const haveCreds = useCallback(() => validCreds(authState.credentials), [authState.credentials])

	function reducer(state, action) {
		console.dir(action);
		switch(action.type) {
			case 'got-callback-response': {
				if(haveUser(state.user)) {
					return state;
				}
				const {verifierResp} = action.payload;

				console.log(verifierResp);
				if(verifierResp && state.verifierResp == null) {
					return {
						...state,
						verifierResp,
					}
				}
				console.log('skipped');

				return state;
			}

			case 'got-access-tokens': {
				const {accessTokens} = action.payload;
				const user = {
					id: accessTokens.user_id,
					handle: accessTokens.screen_name,
				}

				storeUserTokens(accessTokens);
				storeUser(user);

				return {
					...state,
					//loading: false,
					user,
					credentials: {
						accessKey: accessTokens.oath_token,
						accessSecret: accessTokens.oath_secret,
					}
				}
			}

			default: {
				console.warn('useTwitterSignin: undefined action, ', action);
			}
		}
	}

	async function handleStartAuth() {
		const requestToken = await oAuthApi.getUserRequestToken();
		if (requestToken.oauth_callback_confirmed !== 'true') {
			throw new Error('Twitter OAuth 1.0: callback confirmation failed');
		}
		console.dir(requestToken);
		storeRequestToken(requestToken.oauth_token);
		window.location.replace(oAuthApi.createUserOAuthUrl(requestToken));
	}

	function handleCallback() {
		const verifierResp = oAuthApi.catchOAuthCallback();
		if(verifierResp && nonEmptyArray(verifierResp.oauth_token)) {
			dispatch({type: 'got-callback-response', payload: {verifierResp}});
		}
	}


	// @dev Extract callback response params from verifier callback
	useEffect(() => {
		handleCallback();
	}, []);

	useEffect(() => {
		async function fetchAccessTokens(requestToken, verifierToken) {
			const accessTokens = await oAuthApi.getUserAccessToken(requestToken, verifierToken);
			console.dir(accessTokens);
			dispatch({type: 'got-access-tokens', payload: {accessTokens}});
		}

		console.log(authState);
		if(authState.verifierResp && !haveUser()) {
			console.log('fetching user creds');
			fetchAccessTokens(authState.verifierResp.oauth_token, authState.verifierResp.oauth_verifier);
		}
	}, [authState.verifierResp, haveUser])


	const isSignedIn = useCallback(() => {
		return haveUser() && haveCreds()
	}, [haveUser, haveCreds])

	return {
		handleStartAuth,
		isSignedIn,
		user: authState.user,
		credentials: authState.userTokens,
	}
}

function storeUserTokens (tokens) {
	// TODO if env == dev
	window.localStorage.setItem('oauth_token', tokens.oauth_token);
	window.localStorage.setItem('oauth_token_secret', tokens.oauth_token_secret);
}

function storeRequestToken (token) {
	window.localStorage.setItem('request_token', token);
}

function retrieveRequestToken (token) {
	return window.localStorage.getItem('request_token')
}

function storeUser (user) {
	window.localStorage.setItem('user_id', user.id);
	window.localStorage.setItem('user_handle', user.handle);
}

function retrieveUser () {
	return {
		id: window.localStorage.getItem('user_id'),
		handle: window.localStorage.getItem('user_handle')
	}
}

export function retrieveUserTokens () {
	const oauth_token = window.localStorage.getItem('oauth_token');
	const oauth_secret = window.localStorage.getItem('oauth_token_secret');
	return {
		oauth_token,
		oauth_secret
	}
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
	return creds && nonEmptyArray(creds.oauth_token) && nonEmptyArray(creds.oauth_token_secret);
}
