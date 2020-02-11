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
	const [escapeHatch, setEscapeHatch] = useState(null);

	return (
		<Context.Provider
			value={useMemo(() => ({
					setLoading,
					loading,
					escapeHatch,
					setEscapeHatch,
			}),
				[
					loading,
					setLoading,
					escapeHatch,
					setEscapeHatch,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
			//{props && props.children ? props.children : null}
