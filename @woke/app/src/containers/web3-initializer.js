import React, { useEffect } from 'react';
import { Web3ContextProvider, useWeb3Instance } from '../hooks/web3context';

// Logical containers
import Web3Container from './web3-container';

// View containers
import Loading from './views/loading';
import WokeSpan from '../components/text/span-woke';


export default function Web3Initializer(props) {
	const {wallet, ...innerProps} = props;
	const { web3IsReady, network, web3Instance, account } =  useWeb3Instance(wallet);

	useEffect(() => {
		if(account) {
			console.log('Using wallet address: ', account);
		}
	}, [account]);

	function Woken() {
		return (
			<WokeSpan styles={{lineHeight:'10px'}}>Woken</WokeSpan>
		);
	}

	return (
		<>
			{ web3IsReady() ? (
				<Web3ContextProvider
					web3={web3Instance}
					networkId={network.id}
					account={account}
					{ ...innerProps }
				>
					<Web3Container wallet={wallet}/>
				</Web3ContextProvider> 

			) : <Loading message={<>A <Woken/> shared is a <Woken/> doubled.</>}/>
					//) : <Loading message={'A Woken shared is a Woken doubled.'}/>
					// 'Reading akashic record
					// Things that are things that were things that have not yet come
					// to pass
			}
		</>
	);
}
