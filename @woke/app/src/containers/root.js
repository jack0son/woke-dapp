import React, {useState, useEffect} from 'react'

// Logical containers
import Authentication from './authentication'
import Web3Initializer from './web3-initializer'

// View container
import Root from './views/root'

// Hooks
import { RootContextProvider } from '../hooks/root-context'
import TwitterContextProvider from '../hooks/twitter/index.js'
import useHedgehog from '../hooks/hedgehog'

// Instances
import HedgehogWallet from '../lib/wallet/wallet'
const wallet = new HedgehogWallet(); 


export default function RootContainer(props) {
	const hedgehog = useHedgehog(wallet);

	const renderAuthentication = () => (
		<Authentication
			hedgehog={hedgehog}
		/>
	);

	const renderWeb3Initializer = () => (
		<Web3Initializer
			wallet={hedgehog.getWallet()}
		/>
	);

	return (
		<RootContextProvider>
			<Root>
				<TwitterContextProvider>
					{	!hedgehog.state.signedIn ? 
							renderAuthentication() : 
							renderWeb3Initializer()
					}
				</TwitterContextProvider>
			</Root>
		</RootContextProvider>
	);
}
