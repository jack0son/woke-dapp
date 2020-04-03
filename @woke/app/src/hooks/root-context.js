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
	const [styles, setStyles] = useState({});

	return (
		<Context.Provider
			value={useMemo(() => ({
				setLoading,
				loading,
				escapeHatch,
				setEscapeHatch,
				styles,
				setStyles,
			}),
				[
					styles,
					setStyles,
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
