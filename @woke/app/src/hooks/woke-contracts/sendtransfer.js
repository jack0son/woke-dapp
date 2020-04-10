import React, { useState, useEffect, useReducer, useRef } from 'react'
import { useWeb3Context } from '../web3context';
import { safePriceEstimate } from '../../lib/web3/web3-utils'
import useTxTimer from './tx-timer';


// User friendly send transfer with user ID checking
// Handles input data to token transfer
export default function useSendTransferInput({
	defaultRecipient,
	defaultAmount,
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
			setError(sendTransfers.error);
		}
	}, [sendTransfers.error]);

	return {
		handleChangeInput,
		handleInputEvent,
		handleSubmitTransfer,
		handleSelectRecipient,
		handleChangeInput,
		handleClearRecipient,
		recipient,
		amount: input.amount,
		txHash: sendTransfers.txHash,
		currentTransfer: sendTransfers.currentTransfer,
		pending: sendTransfers.pending,
		timer: sendTransfers.timer,
		error,
	};
}

// Handle submitting transfer data to WokeToken smart contract
export function useSendTransfers (recipient, handleClearRecipient) {
	const { account, useSend, useSubscribeCall, useContract, web3 } = useWeb3Context();

	const nullArgs = {userId: '', amount: 0}
	const [sendQueued, setSendQueued] = useState(false);
	const [transferArgs, setTransferArgs] = useState(nullArgs);
	const [safeTxOpts, setSafeTxOpts] = useState();
	const [txOptsError, setTxOptsError] = useState(null);
	const [currentTransfer, setCurrentTransfer] = useState({
		recipient: null, amount: null, txHash: null,
	});

	// TODO use network config and web3 utils to set gas
	const gWei = 1000000000; // 1 GWei
	let txOpts = {gas: 500000, gasPrice: gWei * 30, from: account};
	const sendTransferClaimed = useSend('WokeToken', 'transferClaimed', txOpts);
	const sendTransferUnclaimed = useSend('WokeToken', 'transferUnclaimed', txOpts);

	const wokeTokenContract = useContract('WokeToken');
	const recipientIsClaimed = useSubscribeCall(
		'WokeToken',
		'userClaimed',
		recipient ? recipient.id : ''
	);

	const txTimer = useTxTimer(15000);

	// Update gas estimate when recipient prop changes
	const prevRecipient = useRef({id: '', ...recipient});
	useEffect(() => {
		const getSafeTxOpts = (claimed, toId = 'dummy', amount = '10') => {
			const method = `transfer${claimed ? 'Claimed' : 'Unclaimed'}`;
			safePriceEstimate(web3)(wokeTokenContract, method, [toId, amount], txOpts, { speedMultiplier: 1.5 })
				.then(({ limit, price }) => setSafeTxOpts({gas: limit, gasPrice: price}))
				.catch(error => {
					setTxOptsError({
						message: `Ran out of ETH. Tweet 'gas me fam @getwoketoke' to get more`,
						action: 'disable',
					})
				})
		}

		if(nonEmptyString(recipient && recipient.id) && recipient.id != prevRecipient.current.id) {
			prevRecipient.current = recipient;
			getSafeTxOpts(recipientIsClaimed);
		}
	}, [account, recipientIsClaimed, transferArgs.userId])


	// Need to use effect to wait for cacheCall result
	useEffect(() => {
		//console.log('Transfer:\tqueued ', sendQueued);
		//console.log('Transfer:\trecipientIsClaimed ', recipientIsClaimed);
		//console.log('Transfer:\tRecipient', recipient);
		//console.log('Transfer:\ttransferArgs', transferArgs);

		if(sendQueued && (recipientIsClaimed === true || recipientIsClaimed === false) && transferArgs.userId != '' && transferArgs.userId == recipient.id) {
			console.log(`${transferArgs.userId} is ${recipientIsClaimed ? 'claimed' : 'unclaimed'}`);
			let transferMethod;
			switch(recipientIsClaimed) {
				case true: {
					console.log(`transferClaimed() to: ${transferArgs.userId}, amount:${transferArgs.amount}`);
					transferMethod = sendTransferClaimed;
					break;
				}

				case false: {
					console.log(`transferUnclaimed() to:${transferArgs.userId}, amount:${transferArgs.amount}`);
					transferMethod = sendTransferUnclaimed;
					break;
				}

				default: {
					// Do nothing, wait for cacheCall result
					return;
				}
			}

			if(!transferMethod.send('useOpts', transferArgs.userId, transferArgs.amount, safeTxOpts)) {
				console.error('... Failed to send transfer');
			} else {
				txTimer.start();
				setCurrentTransfer({
					recipient,
					amount: transferArgs.amount,
					txHash: null,
				});
			}
			//handleClearRecipient();
			setSendQueued(false);
		}
	}, [recipientIsClaimed, sendQueued, transferArgs.userId, transferArgs.amount]);

	const submitTransfer = (userId, amount) => {
		setTransferArgs({userId, amount});
		setSendQueued(true);
	}

	const error = txOptsError || sendTransferClaimed.error || sendTransferUnclaimed.error;

	const txHash = sendTransferClaimed.txHash || sendTransferUnclaimed.txHash;
	const pending = sendQueued || sendTransferClaimed.pending || sendTransferUnclaimed.pending;

	// Update pending transfers
	useEffect(() => {
		if(!pending) {
			txTimer.stop();
		}

		setCurrentTransfer(t => ({...t, txHash, pending }));
	}, [txHash, pending])

	return {
		submit: submitTransfer,
		error: error,
		txHash,
		pending,
		currentTransfer,
		timer: txTimer,
	};
}

// @brokenwindow
function nonEmptyString(str) {
	return str && str.length && str != '' && str.length > 0;
}
