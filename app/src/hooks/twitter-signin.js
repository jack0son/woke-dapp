import React, { useRef, useEffect, useReducer, useMemo, useState} from 'react'

import twitter from '../lib/twitter'

const verifierPath = '/oauth_twitter';

// @notice check if user auth tokens exist in local storage 
export const checkAuthTokens = () => {
	const userTokens = retrieveUserTokens();
	if(!userTokens.oauth_token && !userTokens.oauth_token_secret) {
		return {
			status: false,
			tokens: null
		}
	}

	console.dir(userTokens);
	return {
		status: true,
		tokens: userTokens
	}
}

// @notice Check if twitter user auth tokens exist
export const useAuthTokens = () => {
	const [status, setStatus] = useState(null);
	const [userTokens, setUserTokens] = useState(null)
	const [user, setUser] = useState(null);

	const refresh = () => {
		let tokens = retrieveUserTokens();
		if(!tokens.oauth_token || !tokens.oauth_secret) {
			setStatus(false);
			return;
		}
		setUserTokens(tokens);
		setUser(retrieveUser());
		setStatus(true);
	}

	if(status == null)
		refresh();

	return {
		user,
		userTokens,
		status,
		refresh		// Retrieve new tokens from store
	}
}

function catchOAuthResp() {
	//if(window.location.pathname == verifierPath) {
		if(window.location.search) {
			let callbackParams = window.location.search.substr(1);
			return twitter.deparam(callbackParams);
		}
	//}
}


export const useTwitterSignIn = (triggerUpdate) => {
	//const [requestToken, setRequestToken] = useState(null);
	const [verifierToken, setVerifierToken] = useState(null);
	const [userTokens, setUserTokens] = useState();
	const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
	const requestToken = retrieveRequestToken();
	// Catch oauthCallback

	const callbackResp = catchOAuthResp();

	// 1. Initial oauth request
	const handleAuthUser = async () => {
		const requestToken = await twitter.getUserOAuthToken();
		console.dir(requestToken);
		if (requestToken.oauth_callback_confirmed !== 'true') {
			throw new Error('Twitter OAuth 1.0: callback confirmation failed');
		}
		storeRequestToken(requestToken.oauth_token);
		setLoading(true);

		const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${requestToken.oauth_token}`
		window.location.replace(authUrl)
		//popupCenter(authUrl, 'Twitter Sign-in (Get Woke)', 400, 700);
		//setRequestToken(requestToken);
	}

	// 2. Receive callback from oauth request then store verifier token
	useEffect(() => {
		if(!checkAuthTokens.status && callbackResp && callbackResp.oauth_token && callbackResp.oauth_verifier) {
			setLoading(true);

			console.log('Got callback response verifier token');
			console.dir(requestToken);
			if(requestToken != callbackResp.oauth_token) {
				console.error('Verifier token does not match request token')
				console.log('verifier: ', callbackResp.oauth_token); 
				console.log('Request: ', requestToken); 
			} else {
				console.log('Verifier matches oauth token');
				setVerifierToken(callbackResp.oauth_verifier);
			}
		}
	}, [callbackResp])

	// 3. Use oauth tokens to get access tokens
	useEffect(() => {
		const fetchAccessTokens = async () => {
			const tokens = await twitter.getUserAccessToken(requestToken, verifierToken);
			storeUserTokens(tokens);
			setUser({
				id: tokens.user_id,
				handle: tokens.screen_name
			})
			setLoading(false);
			triggerUpdate();
		}

		if(verifierToken) {
			fetchAccessTokens()
		}
		
	}, [verifierToken])

	useEffect(() => {
		if(user)
			storeUser(user);
	}, [user])

	return {
		handleAuthUser,
		state: {
			requestToken,
			user,
			loading
		}
	}
}

// Retrieve twitter client with user auth tokens
export const useTwitterUserClient = authTokens => {
	const [user, setUser] = useState(null);
	const [userClient, setUserClient] = useState(null);

	useEffect(() => {
		const getClient = async () => {
			await twitter.initUserClient(authTokens.oauth_token, authTokens.oauth_token_secret);
			const {id, screen_name} = await twitter.verifyCredentials();
			setUser({
				id,
				handle: screen_name
			})
			setUserClient(twitter);
		}

		if(authTokens.status === true) {
			getClient();
		}
	}, [authTokens.status])

	return {
		client: userClient,
		user
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

function popupCenter(url, title, w, h) {
	var left = (document.body.clientWidth/2)-(w/2);
	var top = (document.body.clientHeight.height/2)-(h/2);
	return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
}
