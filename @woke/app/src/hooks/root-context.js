import React, {
	useContext,
	useMemo,
	createContext,
	useState,
} from 'react';

const Context = createContext();
export const useRootContext = () => useContext(Context);

export function RootContextProvider({ children, ...props }) {
	const { hedgehog } = props;

	const [loading, setLoading] = useState(false);
	const [escapeHatch, setEscapeHatch] = useState(null);
	const [styles, setStyles] = useState({});
	const [headerChildren, setHeaderChildren] = useState([]);

	return (
		<Context.Provider
			value={useMemo(() => ({
				hedgehog,
				setLoading,
				loading,
				escapeHatch,
				setEscapeHatch,
				styles,
				setStyles,
				headerChildren,
				setHeaderChildren,
			}),
				[
					hedgehog,
					loading,
					setLoading,
					escapeHatch,
					setEscapeHatch,
					styles,
					setStyles,
					headerChildren,
					setHeaderChildren,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
//{props && props.children ? props.children : null}
