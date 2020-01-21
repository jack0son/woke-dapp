import React, { useReducer } from 'react';
import {
	getUserOAuthToken,
	createUserOAuthUrl,
	getUserAccessToken,
}



export default function useUserAuth() {
	const [authState, dispatch] = useReducer(reducer, {
		//state: 'INIT',
		loading: false,
		requestToken: retrieveRequestToken(),
		verifierToken: null,
		userTokens: retrieveUserTokens(),
		user: retrieveUser(),
	});

	function reducer(state, action) {
		switch(action.type) {
			case 'got-callback-response': {
				if(haveUser(state.user)) {
					return state;
				}

				fetchAccessTokens();

				return {
					...state,
					callbackResp: action.payload.callbackResp,
					requestToken: action.payload.requestToken
				}
			}

			case 'got-access-tokens': {
				const {userTokens} = action.payload;
				const user = {
					id: userTokens.user_id,
					handle: userTokens.screen_name,
				}

				storeUserTokens(userTokens);
				storeUser(user);

				return {
					...state,
					loading: false,
					user,
				}
			}

			default: {
				console.warn('useTwitterSignin: undefined action, ', action);
			}
		}
	}

	async function handleStartAuth() {
		const requestToken = await twitter.getUserOAuthToken();
		if (requestToken.oauth_callback_confirmed !== 'true') {
			throw new Error('Twitter OAuth 1.0: callback confirmation failed');
		}
		storeRequestToken(requestToken);
		window.location.replace(twitter.createUserOAuthUrl(requestToken));
	}

	(function handleCallback() {
		const callbackResp = catchOAuthCallback();
		if(!haveUser(state.user)) {
			dispatch({type: 'got-callback-response', payload: {callbackResp}});
		}
	})();

	function fetchAccessTokens() {
		const accessTokens = await twitter.getUserAccessToken(requestToken, verifierToken);
		dispatch({type: 'got-access-tokens', payload: accessTokens});
	}

	return {
		handleStartAuth,
		user: state.user,
		credentials: state.userTokens,
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
	return nonEmptyArray(user.id) && nonEmptyArray(user.handle);
}
