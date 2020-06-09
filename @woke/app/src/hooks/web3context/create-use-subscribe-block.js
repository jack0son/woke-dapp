
import React, { useState, useEffect, useMemo } from 'react'
import { useWeb3Context } from '.';
import { subscribeBlockHeaders } from '../../lib/web3/web3-utils'

export default web3 => callback => {
	//const { useContractSubscriptions, useContract } = useWeb3Context();
	const [sub, setSub] = useState(null);
	const [latest, setLatest] = useState(null);
	// TODO this useCallback should be in useContractSubscriptions

	useEffect(() => {
		setSub(sub => {
			if(sub == null) {
				//console.log('Creating new subscription for ', contractName);
				let newSub = subscribeBlockHeaders((blockHeader) => {
					setLatest(blockHeader);
					callback(blockHeader);
				});
				return newSub;	
			}

			sub.subscribe(callback);
			return sub;
		});
	}, [callback]);

	// Stop subscription on unmount
	useEffect(() => {
		if(sub) {
			return sub.stop;
		}
	}, [sub]);

	return latest;
}
