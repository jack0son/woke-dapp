import React, {
	useContext,
	useMemo,
	createContext,
	useState,
} from 'react';
import { createBrowserHistory } from 'history';

const Context = createContext();
export const useRouterContext = () => useContext(Context);


export function RouterContextProvider({ children, ...props }) {
	const history = createBrowserHistory();

	return (
		<Context.Provider
			value={useMemo(() => ({
				history,
			}),
				[
					history,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
