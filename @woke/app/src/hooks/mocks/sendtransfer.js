import React, { useState, useEffect, useReducer } from 'react'
import useTxTimer from '../woke-contracts/tx-timer';

export default function useSendTransfer (users) {
	const [recipient, setRecipient] = useState(users[1]);
	const [currentTransfer, setCurrentTransfer] = useState({
		recipient: null, amount: null, txHash: null,
	});
	const [pending, setPending] = useState(null);
	const [error, setError] = useState(null);

	const [input, setInput] = useState({
		screen_name: '',
		amount: 1,
	});

	const txTimer = useTxTimer(5000, {steps: 8});

	// Transfer input
	const handleChangeInput = name => value => {
		value && setInput({ ...input, [name]: value });
	};

	const checkUserExists = (_, screen_name) => new Promise(resolve => {
		const newRecipient = users.find(u => u.screen_name == screen_name);
		console.log(newRecipient);
		newRecipient ? resolve(newRecipient) : resolve(false);
	});


	const handleSelectRecipient = () => {
		setError(null);
		console.log('handleSelectRecipient() ', input.screen_name);
		checkUserExists(null, input.screen_name)
			.then(userObj => {
				if(userObj) {
					if(recipient && recipient.screen_name == userObj.screen_name)
						setRecipient(null); // force re-render for confirm modal side effect

					setRecipient(userObj);
				} else {
					setError('User does not exist');
				}
			})
	}

	const handleSubmitTransfer = () => {
		//setRecipient(null);
		txTimer.start();
		setPending(true);
		setCurrentTransfer({
			recipient,
			amount: input.amount,
			txHash: null,
		});
		setTimeout(() => {
			setPending(false);
			txTimer.stop();
		}, 5000);
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
		currentTransfer: currentTransfer,
		amount: input.amount,
		timer: txTimer,
		error,
	};
}
