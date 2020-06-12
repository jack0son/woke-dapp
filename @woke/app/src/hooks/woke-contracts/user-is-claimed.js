import React, { useEffect, useState, useCallback } from 'react'
import { getContract } from '../../lib/web3/web3-utils'
import { makeWeb3 } from  '../../lib/web3/web3-init'
import { loadContractArtifacts } from  '../../lib/web3/web3-config'

const { UserRegistry } = loadContractArtifacts();
//const {web3, network} = makeWeb3(); // account-less web3
//const userRegistryContract = getContract(web3, UserRegistry, network.id);

export default function useUserIsClaimed(userId) {
	const [claimed, setClaimed] = useState(null);
	const [userRegistry, setUserRegistry] = useState(null);

	useEffect(() => {
		makeWeb3({})
			.then(({web3, network}) => {
				setUserRegistry(() => getContract(web3, UserRegistry, network.id))
			})
	}, []);

	useEffect(() => {
		let abort = false;
		if(userRegistry && userId && userId.length && userId.length > 0) {
			userRegistry.methods.userClaimed(userId).call()
				//.then(result => { if(!abort) setClaimed(result) })
				.then(result => { if(!abort) setClaimed(result) })
		}

		return () => {
			abort = true;
		}
	}, [userId, userRegistry]);

	//useEffect(() => {
	//	if(claimed) {
	//		userRegistry.methods.getAccount(userId).call()
	//			.then(result => { console.log('GOT ACCOUNT', result) })
	//	}
	//}, [claimed]);

	return claimed;
}
