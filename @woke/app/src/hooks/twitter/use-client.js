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
// @credentials: Object containing access key and access secret
export default function useTwitterClient({
	accessKey,
	accessSecret,
}) {
	const [client, setClient] = useState(makeClient({accessKey, accessSecret}))

	// When accesss provided, get a user app instance
	useEffect(() => {
		if(isValidToken(accessKey) && isValidToken(accessSecret)) {
			setClient(makeClient({accessKey, accessSecret}));
		}
	}, [accessKey, accessSecret])

	return client;
}

export function isValidToken(token) {
	// @fix placeholder logic
	return token !== undefined && token !== null && token.length;
}
