import React, { useState, useEffect, useRef, useCallback} from 'react'

import { useWeb3Context } from '.';

// @desc useSubscribeCall
// @dev Update the call value whenever there is an update to contract logs
export default web3 => (contractName, methodName, ...args) => {
	const { account, useContract, useSubscribeContract } = useWeb3Context();
	const contract = useContract(contractName);
	const [callValue, setCallValue] = useState(null);

	// Track mounted state to cancel calls if unmounted
	const isMounted = useRef(true)

	// Call on contract update
	const callMethod = useCallback((logData, blockNumber) => {
		const bn = logData ? logData.blockNumber : blockNumber;
		if(contract) {
			//console.log(`call ${contractName}, ${methodName}: ${args}`);
			//console.dir(contract);
			return contract.methods[methodName](...args).call({from: account}, bn)
				.then(result => {
					console.log(`call:${bn}:${contractName}.${methodName}() ... got `, result);
					if(isMounted.current) {
						setCallValue(result)
						//console.log(`... <${result}> from call ${contractName}, ${methodName}: ${args}`);
					}
				})
				.catch(error => {
					console.error(error);
				});
		}
	}, [contract, contractName, methodName, ...args]);
	
	useSubscribeContract(contractName, callMethod);

	// Run the contract call every time there is a contract log update
	useEffect(() => {
		setCallValue(null);
		callMethod(undefined, 'latest');
	}, [contract, contractName, methodName, ...args]);

	useEffect(() => {
		return () => {
			isMounted.current = false
		}
	}, [])

	return callValue;
}
