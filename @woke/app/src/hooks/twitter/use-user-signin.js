import React, { useReducer, useEffect } from 'react';
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

	function reducer(state, action) {
		console.dir(action);
		switch(action.type) {
			case 'got-callback-response': {
				if(haveUser(state.user)) {
					return state;
				}

				const verifier = action.payload.verifierResp;

				fetchAccessTokens(verifier.oauth_token, verifier.oauth_verifier);

				return {
					...state,
					verifierResp: action.payload.verifierResp,
				}
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
					loading: false,
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
		storeRequestToken(requestToken);
		window.location.replace(oAuthApi.createUserOAuthUrl(requestToken));
	}


	useEffect(() => {
		function handleCallback() {
			const verifierResp = oAuthApi.catchOAuthCallback();
			console.dir(verifierResp);
			if(verifierResp && !authState.verifierResp) {
				dispatch({type: 'got-callback-response', payload: {verifierResp}});
			}
		};

		console.dir(authState);
		if(!authState.verifierResp) {
			handleCallback();
		}
	}, [authState.verifierResp])

	async function fetchAccessTokens(requestToken, verifierToken) {
		const accessTokens = await oAuthApi.getUserAccessToken(requestToken, verifierToken);
		console.dir(accessTokens);
		dispatch({type: 'got-access-tokens', payload: {accessTokens}});
	}

	function isSignedIn() {
		return haveUser(authState.user) && haveCredentials(authState.credentials)
	}

	return {
		handleStartAuth,
		haveUser,
		haveCredentials,
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

function haveUser(user) {
	return user && nonEmptyArray(user.id) && nonEmptyArray(user.handle);
}

function haveCredentials(tokens) {
	return tokens && nonEmptyArray(tokens.oauth_token) && nonEmptyArray(tokens.oauth_token_secret);
}
