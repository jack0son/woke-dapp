import React, {useState, useEffect} from 'react'

// Logical containers
import Claim from './claim'
import Wallet from './wallet'
import Loading from './views/loading'

// Hooks
import useClaimStatus, {states} from '../hooks/woke-contracts/claim-status';

export default function Web3Container(props) {
	const [claimed, setClaimed] = useState(false);
	const userId = retrieveUserId();
	const userHandle = retrieveUserHandle();

	const claimStatus = useClaimStatus(userId);

	const renderClaimProcess = () => (
		<Claim 
			userId={userId}
			userHandle={userHandle}
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
	);

	function renderLoading(message) {
		return (
			<Loading message={message}/>
		);
	}

	function chooseRender() {
		switch(claimStatus) {
			case states.UNCLAIMED: {
				return renderClaimProcess;
			}

			case states.CLAIMED: {
				return renderWallet;
			}

			case states.USER_ALREADY_CLAIMED: {
				console.log('Error: user already claimed by a different address');
				// Go back to login
			}

			case states.ACCOUNT_ALREADY_CLAIMED: {
				console.log('Error: address has already claimed another user');
			}

			default: {
				console.log('web3switch: waiting');
				return () => renderLoading('WAITING');
			}
		}
	}

	const renderFunc = chooseRender();

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
