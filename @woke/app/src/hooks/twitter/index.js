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

const Context = createContext();
export const useTwitterContext = () => useContext(Context);

export default function TwitterContextProvider({children}) {
	const userSignin = useUserSignin();
	const client = useClient(userSignin.credentials);
	const userList = useUsers({appClient: client})
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
