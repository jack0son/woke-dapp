import React, {
	useContext,
	useMemo,
	createContext,
	useState,
} from 'react';

const Context = createContext();
export const useRootContext = () => useContext(Context);

export function RootContextProvider({children}) {
	const [loading, setLoading] = useState(false);

	return (
		<Context.Provider
			value={useMemo(() => ({
					setLoading,
					loading,
			}),
				[
					loading,
					setLoading,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
			//{props && props.children ? props.children : null}
