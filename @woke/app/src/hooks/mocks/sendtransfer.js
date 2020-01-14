import React, { useState, useEffect, useReducer } from 'react'

export default function useSendTransfer (users) {
	const [recipient, setRecipient] = useState(users[1]);
	const [pending, setPending] = useState(null);

	const [input, setInput] = useState({
		handle: '',
		amount: null,
	});

	// Transfer input
	const handleChangeInput = name => event => {
		setInput({ ...input, [name]: event.target.value });
	};

	const handleSelectRecipient = () => {
		setRecipient(users[0]);
	}

	const handleSubmitTransfer = () => {
		setRecipient(null);
		setPending(true);
		setTimeout(() => {
			setPending(false);
		}, 1000);
	}

	const handleClearRecipient = () => {
			setRecipient(null);
	}

	return {
		handleChangeInput,
		handleSubmitTransfer,
		handleSelectRecipient,
		handleChangeInput,
		handleClearRecipient,
		pending,
		recipient,
	};
}
