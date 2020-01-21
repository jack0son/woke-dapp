import React, {useState, useEffect} from 'react'

// Logical containers
import Authentication from './authentication'
import Web3Initializer from './web3-initializer'

// View container
import Root from './views/root'

// Hooks
import TwitterContextProvider from '../hooks/twitter'
import useHedgehog from '../hooks/hedgehog'

// Instances
import HedgehogWallet from '../lib/wallet/wallet'
const wallet = new HedgehogWallet(); 


export default function RootContainer(props) {
	const hedgehog = useHedgehog(wallet);
	const [initWeb3, setInitWeb3] = useState(false);

	let showLogo = true;

	const renderAuthentication = () => (
		<Authentication
			hedgehog={hedgehog}
			renderProp={(show) => {
				showLogo = show;
			}}
		/>
	)

	useEffect(() => {
		if(hedgehog.state.signedIn && !initWeb3)
			setInitWeb3(true);
	}, [hedgehog.state.signedIn])

	return (
		<Root
			hideLogo={!(initWeb3 || showLogo)}
		>
			<TwitterContextProvider>
			{!hedgehog.state.signedIn ? renderAuthentication() : (
				<Web3Initializer
					wallet={hedgehog.getWallet()}
				/>
			)}
			</TwitterContextProvider>
		</Root>
	);
}
