import React, {
	useContext,
	useReducer,
	createContext,
	useState,
	useEffect,
	useMemo
} from 'react';
import { makeClient, oAuthApi } from '../../lib/twitter'

// ** Synchronise access tokens with client API
export default function useTwitterClient({
	accessTokenKey,
	accessTokenSecret,
}) {
	const [client, setClient] = useState(makeClient({accessTokenKey, accessTokenSecret}))

	// When accessTokens provided, get a user app instance
	useEffect(() => {
		if(isValidToken(accessTokenKey) && isValidToken(accessTokenSecret)) {
			setClient(makeClient({accessTokenKey, accessTokenSecret}));
		}
	}, [accessTokenKey, accessTokenSecret])

	return client;
}

export function isValidToken(token) {
	// @fix placeholder logic
	return token !== undefined && token !== null && token.length;
}
