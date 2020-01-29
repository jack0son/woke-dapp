import React, { useEffect } from 'react';
import { Web3ContextProvider, useWeb3Instance } from '../hooks/web3context';

// Logical containers
import Web3Container from './web3-container'

// View containers
import Loading from './views/loading'


export default function Web3Initializer(props) {
	const {wallet, ...innerProps} = props;
	const { web3IsReady, network, web3Instance, account } =  useWeb3Instance(wallet);

	useEffect(() => {
		if(account) {
			console.log('Using wallet address: ', account);
		}
	}, [account]);

	return (
		<>
			{ web3IsReady() ? (
					<Web3ContextProvider
						web3={web3Instance}
						networkId={network.id}
						account={account}
					>
						<Web3Container wallet={wallet}/>
					</Web3ContextProvider> 

				) : <Loading message={'Plugging in ...'}/>
			}
		</>
	);
}
