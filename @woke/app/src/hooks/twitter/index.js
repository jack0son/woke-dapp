import React, {
	useContext,
	createContext,
	useState,
	useEffect,
	useMemo
} from 'react';

import useClient from './use-client'
import useUserSignin from './use-user-signin'
import { useUsers } from './use-app-data'
import { createUseFriends } from './use-user-data'

export const useTwitterContext = () => useContext(Context);
const Context = createContext();

export default function TwitterContextProvider({children}) {
	const userSignin = useUserSignin();
	const client = useClient(userSignin.credentials);
	const userList = useUsers({appClient: client, initialId: '1'})
	const useFriends = useMemo(() => createUseFriends(client), [client]);

	return (
		<Context.Provider
			value={useMemo(
				() => ({
					client,
					userSignin,
					userList,
					useFriends,
				}),
				[
					client,
					userSignin,
					userList,
					useFriends,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
