import React, {useState, useMemo} from 'react'

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
	const handleClaimComplete = () => setClaimed(true);

	const renderClaimProcess = () => (
		<Claim 
			claimStatus={claimStatus}
			userId={userId}
			userHandle={userHandle}
			handleClaimComplete={handleClaimComplete}
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
		if(claimed) {
			// claimStatus and claim hook will race to detect this state
			console.log('Wallet triggered by claim process');
			return renderWallet;
		}

		switch(claimStatus) {
			case states.UNCLAIMED: {
				return renderClaimProcess;
			}

			case states.CLAIMED: {
				console.log('Wallet triggered by contract call');
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
				// Waiting for claim status
				return () => renderLoading('Determining wokeness ... ');
			}
		}
	}

	const renderFunc = useMemo(() => (chooseRender()), [claimed, claimStatus])

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
