import React, { useReducer } from 'react';
import {
	getUserOAuthToken,
	createUserOAuthUrl,
	getUserAccessToken,
}

const actions = {
}

const stateMap = {
	INIT: {
		'fetch-request-token': {next: 'WAITING_REQUEST_TOKEN', reduce:  fetchRequestToken},
		'got-request-token': {next: LOADING, reduce: redirectToSignin},
		'got-verifier-token': {next: 'WAITING_FOR_ACCESS', action: fetchAccessTokens}
	},

	WAITING_REQUEST_TOKEN: {
		'got-request-token': {next: REDIRECTING, reduce: redirectToSignin},

	}

	WAITING_FOR_VERIFIER: {
		'got-verifier-token': {next: 'WAITING_FOR_ACCESS', action: fetchAccessTokens}
	},

	WAITING_FOR_ACCESS: {
		'got-access-token': {next: NEXT_STATE, action: }
	},

	GOT_VERIFIER_TOKEN: {
		
	},

	WAITING_REQUEST_TOKEN: {
		'gotRequestToken':  {next: 
	}
}

function refreshOAuthToken() {
	// If oauth token older than 30 seconds, delete it
}

export default function useUserAuth() {
	const [authState, dispatch] = useReducer(reducer, {
		state: null,
		tokens: {
			accessTokenKey: null,
			accessTokenSecret: null, 
		}
	});

	function reducer(state, action) {
		switch(action.type) {
			case 'gotRequestToken': {
				return {
					...state,
					stage: '
					requestToken: action.payload.requestToken
				}
			}
		}
	}


	// 1. Initial oauth request
	const handleAuthUser = async () => {
		const requestToken = await twitter.getUserOAuthToken();
		console.dir(requestToken);
		if (requestToken.oauth_callback_confirmed !== 'true') {
			throw new Error('Twitter OAuth 1.0: callback confirmation failed');
		}
		storeRequestToken(requestToken.oauth_token);
		setLoading(true);

		window.location.replace(authUrl)
		//popupCenter(authUrl, 'Twitter Sign-in (Get Woke)', 400, 700);
		//setRequestToken(requestToken);
	}
}
