import React, { useState } from 'react';

// Logical containers
import Claim from './claim'
import Wallet from './wallet'

// View containers
import Loading from '../views/loading'

export default function Web3Container(props) {
	// Dummy state 
	const [claimComplete, setClaimComplete] = useState(false);

	const renderClaimProcess = () => (
		<Claim
			// TODO change loading to use avatar image
			handleComplete={() => setClaimComplete(true)}
		/>
	);

	const renderWallet = () => (
		<Wallet/>
	);

	const chooseRender = claimComplete ? renderWallet : renderClaimProcess; 

	return (
		<>
			{ chooseRender() }
		</>
	);
}
