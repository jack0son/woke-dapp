import React, { useState, useEffect, useReducer, useRef } from 'react'
import { useWeb3Context } from '../web3context';
import { safePriceEstimate } from '../../lib/web3/web3-utils';
import useTxTimer from './tx-timer';
import { nonEmptyString } from '../../lib/utils';

import useSendTransfer from './transfer-send';

// User friendly send transfer with user ID checking
// Handles input data to token transfer
export default function useSendTransferInput({
	defaultRecipient,
	defaultAmount,
	balance,
	checkUserExists,
	twitterUsers,
}) {
	const [recipient, setRecipient] = useState(null);
	const [input, setInput] = useState({
		screen_name: defaultRecipient,
		amount: defaultAmount,
	});
	const [error, setError] = useState(null);

	// Transfer input
	const handleInputEvent = name => event => {
		event && event.target && setInput({ ...input, [name]: event.target.value });
	};

	const handleChangeInput = name => value => {
		value && setInput({ ...input, [name]: value });
	};

	useEffect(() => {
		if(input.amount > balance) {
			setInput(input => ({...input, amount: defaultAmount}));
		}
	}, [balance]);

	const handleSelectRecipient = () => {
		sendTransfer.setAmount(input.amount); // always update amount
		setError(null);
		console.log('handleSelectRecipient() ', input.screen_name);
		// Check user exists 
		checkUserExists(null, input.screen_name)
			.then(userObj => {
				if(userObj) {
					setRecipient(userObj);
				} else {
					setError('User does not exist');
				}
			})
	}

	const handleClearRecipient = () => {
		setRecipient(null);
	}

	const sendTransfer = useSendTransfer(recipient, handleClearRecipient);

	const handleSubmitTransfer = () => {
		if(recipient && recipient != '') {
			console.log(`submitTransfer() to: ${recipient.id}, amount:${input.amount}`);
			sendTransfer.submit(recipient.id, input.amount);
			twitterUsers.addId(recipient.id);
			//handleClearRecipient();

		} else {
			console.log(`Error: submitTransfer() to: ${recipient.userId}, amount:${input.amount}`);
			setError('Attempted transfer to no user');
		}
	}

	// Bubble up errors from sendTransfer
	useEffect(() => {
		if(sendTransfer.error) {
			console.dir(error);
			if(sendTransfer.error.message) {
				setError(sendTransfer.error.message);
			} else {
				setError(sendTransfer.error);
			}
		}
	}, [sendTransfer.error]);

	return {
		handleChangeInput,
		handleInputEvent,
		handleSubmitTransfer,
		handleSelectRecipient,
		handleChangeInput,
		handleClearRecipient,
		recipient,
		amount: input.amount,
		txHash: sendTransfer.txHash,
		currentTransfer: sendTransfer.currentTransfer,
		pending: sendTransfer.pending,
		timer: sendTransfer.timer,
		error,
	};
}


