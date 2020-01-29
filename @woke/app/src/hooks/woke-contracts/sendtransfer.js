import React, { useState, useEffect, useReducer } from 'react'
import { useWeb3Context } from '../web3context';


// User friendly send transfer with user ID checking
export default function useSendTransferInput({
	defaultRecipient,
	defaultAmount,
	checkUserExists,
	twitterUsers,
}) {
	const [recipient, setRecipient] = useState(null);
	const [input, setInput] = useState({
		handle: defaultRecipient,
		amount: defaultAmount,
	});
	const [error, setError] = useState(null);

	// Transfer input
	const handleChangeInput = name => event => {
		setInput({ ...input, [name]: event.target.value });
	};

	const handleSelectRecipient = () => {
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

	const sendTransfers = useSendTransfers(recipient, handleClearRecipient);

	const handleSubmitTransfer = () => {
		if(recipient && recipient != '') {
			console.log(`submitTransfer() to: ${recipient.id}, amount:${input.amount}`);
			sendTransfers.submit(recipient.id, input.amount);
			twitterUsers.addId(recipient.id);
			//handleClearRecipient();

		} else {
			console.log(`Error: submitTransfer() to: ${recipient.userId}, amount:${input.amount}`);
			setError('Attempted transfer to no user');
		}
	}

	// Bubble up errors from sendTransfers
	useEffect(() => {
		if(sendTransfers.error) {
			setError(error);
		}
	}, [sendTransfers.error]);

	return {
		handleChangeInput,
		handleSubmitTransfer,
		handleSelectRecipient,
		handleChangeInput,
		handleClearRecipient,
		recipient,
		pending: sendTransfers.pending,
		error
	};
}

export function useSendTransfers (recipient, handleClearRecipient) {
	const { account, useSend, useSubscribeCall, useContract} = useWeb3Context();

	const nullArgs = {userId: '', amount: 0}
	const [sendQueued, setSendQueued] = useState(false);
	const [pending, setPending] = useState(false);
	const [transferArgs, setTransferArgs] = useState(nullArgs);

	// TODO use network config and web3 utils to set gas
	const gWei = 1000000000; // 1 GWei
	let txOpts = {gas: 500000, gasPrice: gWei * 30};
	const sendTransferClaimed = useSend('WokeToken', 'transferClaimed', txOpts);
	const sendTransferUnclaimed = useSend('WokeToken', 'transferUnclaimed', txOpts);

	const wokeTokenContract = useContract('WokeToken');
	const recipientIsClaimed = useSubscribeCall(
		'WokeToken',
		'userClaimed',
		recipient ? recipient.id : ''
	);

	const getUserIsClaimed = (userId) => {
		//return wokeTokenContract.methods.userClaimed(userId).call({from: account})
	}

	// Need to use effect to wait for cacheCall result
	useEffect(() => {
		//console.log('Transfer:\tqueued ', sendQueued);
		//console.log('Transfer:\trecipientIsClaimed ', recipientIsClaimed);
		//console.log('Transfer:\tRecipient', recipient);
		//console.log('Transfer:\ttransferArgs', transferArgs);

		if(sendQueued && (recipientIsClaimed === true || recipientIsClaimed === false) && transferArgs.userId != '' && transferArgs.userId == recipient.id) {
			console.log(`${transferArgs.userId} is ${recipientIsClaimed ? 'claimed' : 'unclaimed'}`);
			let transferChoice;
			switch(recipientIsClaimed) {
				case true: {
					console.log(`transferClaimed() to: ${transferArgs.userId}, amount:${transferArgs.amount}`);
					transferChoice = sendTransferClaimed;
					break;
				}

				case false: {
					console.log(`transferUnclaimed() to:${transferArgs.userId}, amount:${transferArgs.amount}`);
					transferChoice = sendTransferUnclaimed;
					break;
				}

				default: {
					// Do nothing, wait for cacheCall result
					return;
				}
			}

			if(!transferChoice.send(transferArgs.userId, transferArgs.amount)) {
				console.error('... Failed to send transfer');
			}
			handleClearRecipient();
			setSendQueued(false);
		}
	}, [recipientIsClaimed, sendQueued, transferArgs.userId, transferArgs.amount]);

	const submitTransfer = (userId, amount) => {
		setTransferArgs({userId, amount});
		setSendQueued(true);
	}

	const error = sendTransferClaimed.error || sendTransferUnclaimed.error;

	return {
		submit: submitTransfer,
		error: error,
		pending: sendQueued || sendTransferClaimed.pending || sendTransferUnclaimed.pending,
	};
}
