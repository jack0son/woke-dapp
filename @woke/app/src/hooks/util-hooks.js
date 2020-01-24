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

export function usePrevious(value) {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
}
