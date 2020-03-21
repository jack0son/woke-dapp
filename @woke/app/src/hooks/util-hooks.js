import React, { useState, useEffect, useMemo, useRef } from 'react';

export function useInputListener(initialState) {
	const [input, setInput] = useState({
	});
	// Transfer input
	const handleChangeInput = name => event => {
		setInput({ ...input, [name]: event.target.value });
	};

	return {
		input,
		handleChangeInput,
	}
}

// Prevent re-render of unmounted component
// Useful for components doing which do IO
export function useIsMounted() {
	const isMounted = useRef(true)
	useEffect(() => {
		return () => {
			isMounted.current = false
		}
	}, []);

	return isMounted;
}

export function usePrevious(value) {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
}
