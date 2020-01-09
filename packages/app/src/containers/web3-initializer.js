import React, {useState} from 'react';
import {useEffect, useRef} from 'react';

import * as Web3ContextHooks from '../hooks/web3context';

// Logical containers
import Web3Container from './web3-container'

// View containers
import Loading from './views/loading'

import injectWeb3 from '../lib/web3/web3-inject'


export default function Web3Initializer(props) {
	const [web3Provider, setWeb3Provider] = useState(null);
	const [networkId, setNetworkId] = useState(null);
	const [web3State, setWeb3State] = useState(null);
	const [account, setAccount] = useState(null);

	// TODO move to custom hook
	// Initialize custom provider
	useEffect(() => {
		injectWeb3(props.wallet).then(provider => setWeb3Provider(provider));
	}, [])

	// Ensure web3 has custom provider before setting up dizzle
	useEffect(() => {
		async function initializeWeb3() {
			let {web3, networkId} = await Web3ContextHooks.initWeb3(web3Provider);
			setWeb3State({web3, networkId});
			let accounts = await web3.eth.getAccounts();
			setAccount(accounts[0]);
		}

		if(web3Provider) {
			initializeWeb3();
		}
	}, [web3Provider]);

	useEffect(() => {
		if(account) {
			console.log('Using wallet address: ', account);
		}
	}, [account]);
	
	return (
		<>
		{ web3Provider && web3State && account ? 
			<Web3ContextHooks.Web3ContextProvider
				web3={web3State.web3}
				networkId={web3State.networkId}
				account={account}
			>
				<Web3Container wallet={props.wallet}/>
			</Web3ContextHooks.Web3ContextProvider> 

			: <Loading/>
		}
		</>
	);
}
