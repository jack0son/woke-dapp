import React, { useEffect, useState, useCallback } from 'react'
import { getContract } from '../../lib/web3/web3-utils'
import { makeWeb3 } from  '../../lib/web3/web3-init'
import { loadContractArtifacts } from  '../../lib/web3/web3-config'

const { WokeToken } = loadContractArtifacts();
//const {web3, network} = makeWeb3(); // account-less web3
//const wokeTokenContract = getContract(web3, WokeToken, network.id);

export default function useUserIsClaimed(userId) {
	const [claimed, setClaimed] = useState(null);
	const [wokeToken, setWokeToken] = useState(null);

	useEffect(() => {
		makeWeb3({})
			.then(({web3, network}) => {
				setWokeToken(() => getContract(web3, WokeToken, network.id))
			})
	}, []);

	useEffect(() => {
		let abort = false;
		if(wokeToken && userId && userId.length && userId.length > 0) {
			wokeToken.methods.userClaimed(userId).call()
				.then(result => { if(!abort) setClaimed(result) })
		}

		return () => {
			abort = true;
		}
	}, [userId, wokeToken]);

	return claimed
}
