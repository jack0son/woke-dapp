import React, { useReducer } from 'react';
import {
	getUserOAuthToken,
	createUserOAuthUrl,
	getUserAccessToken,
}

export function createSigninUrl(requestToken) {
		const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${requestToken.oauth_token}`
}

export default function useUserAuth() {
	const [authState, dispatch] = useReducer(reducer, {
		state: null,
		tokens: {
		accessTokenKey: null,
		accessTokenSecret: null, 
		}
	});

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
