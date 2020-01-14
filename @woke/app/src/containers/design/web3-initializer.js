import React, {useState} from 'react'
import {useEffect, useRef} from 'react'

// Logical containers
import Web3Container from './web3-container'

// View containers
import Loading from '../views/loading'

export default function Web3Initializer(props) {
	//Dummy state
	const [web3Provider, setWeb3Provider] = useState(null);

	useEffect(() => {
		setWeb3Provider({wallet: props.wallet});
	}, [])

	const renderWeb3 = () => (
		<Web3Container wallet={props.wallet}/>
	);

	const renderLoading = () => (
		<Loading handleDone={() => {}}/>
	);

	return (
		<>
			{ web3Provider ? renderWeb3() : renderLoading() }
		</>
	);
}
