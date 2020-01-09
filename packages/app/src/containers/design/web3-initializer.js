import React, {useState} from 'react'
import {useEffect, useRef} from 'react'

// Logical containers
import Web3Container from './web3-container'

// View containers
import Loading from '../views/loading'

export default function Web3Initializer(props) {
	//Dummy state
	const [drizzle, setDrizzle] = useState(null)
	const [web3Provider, setWeb3Provider] = useState(null);

	useEffect(() => {
		//injectWeb3(props.wallet).then(provider => setWeb3Provider(provider));
		//setWeb3Provider(injectWeb3(props.wallet));
		setWeb3Provider({wallet: props.wallet});
	}, [])

	// Ensure web3 has custom provider before setting up dizzle
	useEffect(() => {
		if(web3Provider !== null) {
			setDrizzle({web3Provider});
		}
	}, [web3Provider]);

	const renderDrizzle = () => (
			<Web3Container wallet={props.wallet}/>
	);

	const renderLoading = () => (
		<Loading handleDone={() => {}}/>
	);
	
	return (
		<>
		{ web3Provider && drizzle ? renderDrizzle() : renderLoading() }
		</>
	);
}
