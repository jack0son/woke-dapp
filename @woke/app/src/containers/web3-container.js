import React, {useState, useEffect} from 'react'

// Logical containers
import Claim from './claim'
import Wallet from './wallet'

export default function Web3Container(props) {
	const [claimed, setClaimed] = useState(false);
	//const claimStatus = useClaimStatus();

	const renderClaimProcess = () => (
		<Claim 
			userId={retrieveUserId()}
			userHandle={retrieveUserHandle()}
			renderProp={(claimStage) => {
				if(claimStage == 'CLAIMED') {
					setClaimed(true);
				}
			}}
		/>
	)

	const renderWallet = () => (
		<Wallet
			myUserId={retrieveUserId()}
			myHandle={retrieveUserHandle()}
		/>
	)

	const renderFunc = claimed ? renderWallet : renderClaimProcess; // choose render

	return (
		<>
		{renderFunc()}
		</>
	)
}

function retrieveUserId () {
	return window.localStorage.getItem('user_id');
}

function retrieveUserHandle () {
	return window.localStorage.getItem('user_handle');
}
