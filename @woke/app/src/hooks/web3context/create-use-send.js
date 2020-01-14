import React, { useState, useEffect, useMemo, useCallback} from 'react'
import { useWeb3Context } from '.';


// @dev useSend
// @dev Send a method transaction and track the transaction state
// @dev useSend is single threaded: only one transaction per hook 
// instance is allowed
export default web3 => (contractName, methodName, sendOptions) => {
	const [txState, setTxState] = useState({
		pending: false,
		txHash: null,
		receipt: null,
		error: null,
	});

	const { account, useContract } = useWeb3Context();
	const contract = useContract(contractName);

	let opts = {
		from: account,
		...sendOptions
	}

	const send = (...args) => {
		if(!txState.pending) {
			setTxState(txState => ({
				...txState,
				pending: true,
				error: null,
				receipt: null,
			}));

			contract.methods[methodName](...args).send(opts)
				.on('transactionHash', hash => setTxState(txState => ({...txState, txHash: hash})))
				.on('receipt', receipt => {
					setTxState(txState => ({
						...txState,
						pending: false,
						error: null,
						receipt: receipt,
					}));
					console.log('... tx receipt: ', receipt);
				})
				.on('error', error => {
					setTxState(txState => ({
						...txState,
						pending: false,
						error: error,
					}));
				})
			console.log('... tx send with opts: ', opts);

			return true;
		} 

		// Failed to submit
		return false;
	}

	const {pending, txHash, receipt, error} = txState;

	useEffect(() => {
		if(txHash) {
			console.log('... tx signed: ', txHash);
		}
	}, [txHash]);

	useEffect(() => {
		if(txState.error)
			console.log('... tx error: ', txState.error);
	}, [txState.error]);

	const [status, setStatus] = useState();
	useEffect(() => {
		const getStatus = () => {
			if(txState.pending) {
				return 'pending';
			} else if(txState.error) {
				return 'error';
			} else if(txState.receipt){
				return 'success'
			} else {
				return undefined
			}
		}

		setStatus(getStatus);
	}, [pending, txHash, receipt, error]);

	return {
		send,
		pending: txState.pending,
		txHash: txState.txHash,
		receipt: txState.receipt,
		error: txState.error,
		status: status,
	}
}
