import React, { useEffect, useState } from 'react';
import {
	makeWeb3, 
	makeWalletProvider,
	injectWeb3,
} from '../../lib/web3/web3-init'


export default function useWeb3Instance(wallet) {
	const [provider, setProvider] = useState(null);
	const [network, setNetwork] = useState(null);
	const [web3Instance, setWeb3Instance] = useState(null);
	const [account, setAccount] = useState(null);

	useEffect(() => {
		setProvider(makeWalletProvider(wallet));
	}, [wallet])

	useEffect(() => {
		async function initializeWeb3() {
			let {web3, network} = await makeWeb3(provider);
			let accounts = await web3.eth.getAccounts();
			setWeb3Instance(web3);
			setNetwork(network);
			setAccount(accounts[0]);
		}

		if(provider != null) {
			initializeWeb3();
		}
	}, [provider]);

	const web3IsReady = () => {
		return (
			(network != null && network.id) &&
			web3Instance != null &&
			account != null
		);
	}

	return {
		web3IsReady,
		network,
		web3Instance,
		account
	}
}
