import React, { useState, useEffect, useMemo } from 'react';

export function useInputListener(initialState) {
	const [input, setInput] = useState({
	});
	// Transfer input
	const handleChangeInput = name => event => {
		setInput({ ...input, [name]: event.target.value });
	};
}
