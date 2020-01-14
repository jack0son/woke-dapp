import React, {useState} from 'react';
import {useEffect, useRef} from 'react';

import * as Web3ContextHooks from '../hooks/web3context';

// Logical containers
import Web3Container from './web3-container'

// View containers
import Loading from './views/loading'

import {injectWeb3, makeWeb3} from '../lib/web3/web3-init'

function useWeb3Instance(wallet) {
	const [provider, setProvider] = useState(null);
	const [networkId, setNetworkId] = useState(null);
	const [web3Instance, setWeb3Instance] = useState(null);
	const [account, setAccount] = useState(null);

	useEffect(() => {
		//injectWeb3(wallet).then(provider => setProvider(provider));
		setProvider(injectWeb3(wallet));
	}, [wallet])

	useEffect(() => {
		async function initializeWeb3() {
			let {web3, network} = await makeWeb3(provider);
			let accounts = await web3.eth.getAccounts();
			//console.dir(network);
			setWeb3Instance(web3);
			setNetworkId(network.id);
			setAccount(accounts[0]);
		}

		if(provider != null) {
			//console.dir(provider);
			initializeWeb3();
		}
	}, [provider]);

	const web3IsReady = () => {
		return (
			networkId != null &&
			web3Instance != null &&
			account != null
		);
	}

	return {
		web3IsReady,
		networkId,
		web3Instance,
		account
	}
}

export default function Web3Initializer(props) {
	const {wallet, ...innerProps} = props;
	const {web3IsReady, networkId, web3Instance, account } =  useWeb3Instance(wallet);

	useEffect(() => {
		if(account) {
			console.log('Using wallet address: ', account);
		}
	}, [account]);


	return (
		<>
			{ web3IsReady() ? (
					<Web3ContextHooks.Web3ContextProvider
						web3={web3Instance}
						networkId={networkId}
						account={account}
					>
						<Web3Container wallet={wallet}/>
					</Web3ContextHooks.Web3ContextProvider> 

				) : <Loading/>
			}
		</>
	);
}
