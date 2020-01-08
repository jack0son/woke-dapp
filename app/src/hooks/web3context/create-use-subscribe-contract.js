import React, { useState, useEffect, useCallback } from 'react'
import { useWeb3Context } from '.';

// @dev createUseSubscribeContract
// @dev Call the callback everytime there is an update to the contract's logs
export default web3 => (contractName, callback) => {
	const { useContractSubscriptions, useContract } = useWeb3Context();
	const contract = useContract(contractName);
	const [sub, setSub] = useState(null);

	// TODO this useCallback should be in useContractSubscriptions

	useEffect(() => {
		if(sub == null) {
			console.log('Creating new subscription for ', contractName);
			let newSub = useContractSubscriptions(contract, contractName, callback);
			setSub(newSub);
		} else {
			sub.update(callback);
		}
	}, [contractName, callback]);

	// Stop subscription on unmount
	useEffect(() => {
		if(sub) {
			return sub.stop;
		}
	}, [sub]);
}

