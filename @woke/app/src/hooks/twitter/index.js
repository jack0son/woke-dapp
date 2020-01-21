import React, {
	useContext,
	createContext,
	useState,
	useEffect,
	useMemo
} from 'react';

import useClient from './use-client'
import useUserSignin from './use-user-signin'
import {useTwitterUsers} from './use-app-data'

export const useTwitterContext = () => useContext(Context);
const Context = createContext();

export default function TwitterContextProvider({children}) {
	const userSignin = useUserSignin();
	const client = useClient(userSignin.credentials);
	const useTwitterUsers = useTwitterUsers({appClient: client, initialId: '1'})

	return (
		<Context.Provider
			value={useMemo(
				() => ({
					client,
					userSignin,
				}),
				[
					client,
					userSignin,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
