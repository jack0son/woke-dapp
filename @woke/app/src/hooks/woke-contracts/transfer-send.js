import React, { useState, useEffect, useReducer, useRef } from 'react'
import { useWeb3Context } from '../web3context';
import { safePriceEstimate } from '../../lib/web3/web3-utils'
import useTxTimer from './tx-timer';
import { nonEmptyString } from '../../lib/utils';

// Handle submitting transfer data to UserRegistry smart contract
export default function useSendTransfers (recipient, handleClearRecipient) {
	const { network, account, useSend, useSubscribeCall, useContract, web3 } = useWeb3Context();

	const nullArgs = {userId: '', amount: 1}
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
	const sendTransferClaimed = useSend('UserRegistry', 'transferClaimed', txOpts);
	const sendTransferUnclaimed = useSend('UserRegistry', 'transferUnclaimed', txOpts);

	const userRegistryContract = useContract('UserRegistry');
	const recipientIsClaimed = useSubscribeCall(
		'UserRegistry',
		'userClaimed',
		recipient ? recipient.id : ''
	);

	const balance = useSubscribeCall('WokeToken', 'balanceOf', account);

	// @TODO get time estimate from config
	const txTimer = useTxTimer(network.blockTime || 18000, { steps: network.blockTime/200 });

	// Update gas estimate when recipient prop changes
	const prevRecipient = useRef({id: '', ...recipient});
	useEffect(() => {
		const getSafeTxOpts = (claimed, toId = 'dummy', amount = '1') => {
			const method = `transfer${claimed ? 'Claimed' : 'Unclaimed'}`;
			safePriceEstimate(web3)(userRegistryContract, method, [toId, amount], txOpts, { speedMultiplier: 1.5 })
				.then(({ limit, price }) => setSafeTxOpts({gas: limit, gasPrice: price}))
				.catch(error => {
					console.log(error);
					if(error.message.includes('gas')) {
						setTxOptsError( `Ran out of ETH. Tweet 'gas me fam @getwoketoke' to get more`);
					}
					//{
					//	message: `Ran out of ETH. Tweet 'gas me fam @getwoketoke' to get more`,
					//	action: 'disable',
					//})
				})
		}

		if(nonEmptyString(recipient && recipient.id) && recipient.id != prevRecipient.current.id && balance !== null) {
			prevRecipient.current = recipient;
			if(balance == 0) {
				setTxOptsError(`You are broke.`);
			}
			getSafeTxOpts(recipientIsClaimed, transferArgs.userId, transferArgs.amount);
		}
	}, [account, balance, recipientIsClaimed, transferArgs.userId])


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
				txTimer.stop();
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

	const receipt = sendTransferClaimed.receipt || sendTransferUnclaimed.receipt;
	const txHash = sendTransferClaimed.txHash || sendTransferUnclaimed.txHash;
	const pending = sendQueued || sendTransferClaimed.pending || sendTransferUnclaimed.pending;

	useEffect(() => {
		if(receipt && !pending) {
			txTimer.stop();
		}
	}, [receipt, txTimer]);

	// Update pending transfers
	useEffect(() => {
		if(!pending) {
			txTimer.stop();
		}

		setCurrentTransfer(t => ({...t, txHash, pending }));
	}, [txHash, pending])

	return {
		setAmount: (amount) => setTransferArgs(t => ({...t, amount})),
		submit: submitTransfer,
		error: error,
		txHash,
		pending,
		currentTransfer,
		timer: txTimer,
	};
}
