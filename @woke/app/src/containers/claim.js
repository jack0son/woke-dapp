import React, {useState, useEffect} from 'react'

// View containers
import Claim from './views/claim'

// Custom hooks
import useClaimUser from '../hooks/woke-contracts/claimuser-flow';
import { useWeb3Context } from '../hooks/web3context';
import useTxTimer from '../hooks/woke-contracts/tx-timer';


export default function ClaimContainer(props) {
	const [tweetedClaimString, setTweetedClaimString] = useState(retrieveTweeted());
	const { network } = useWeb3Context();
	const claim = useClaimUser({
		userId: props.userId,
		userHandle: props.userHandle,
		claimStatus: props.claimStatus,
	});

	const timer = useTxTimer(network.blockTime, {steps: network.blockTime/100 });

	useEffect(() => {
		if(tweetedClaimString) {
			claim.stageTriggers.userConfirmedTweeted();
		}
	}, [tweetedClaimString])

	const handleTweeted = () => {
		claim.stageTriggers.userClickedPostTweet();
	}

	const handleConfirmedTweeted = () => {
		console.log('CONFIRMED TWEETED')
		claim.stageTriggers.userConfirmedTweeted();
		setTweetedClaimString(true);
		//storeTweeted();
	}

	const handleNotTweeted = () => {
		console.log('NOT TWEETED')
		claim.stageTriggers.userDidNotTweet();
		setTweetedClaimString(false);
	}

	return (
		<>
		<Claim
			claimState={claim}
			handleTweeted={handleTweeted}
			handleConfirmedTweeted={handleConfirmedTweeted}
			handleNotTweeted={handleNotTweeted}
			timer={timer}
		/>
		{ props.renderProp(claim.stageList[claim.stage]) }
		</>
	);
}

function retrieveTweeted () {
	const tweeted = window.localStorage.getItem('tweeted')
	if(tweeted == undefined || tweeted == null || !tweeted) {
		return false;
	}
	return tweeted;
}

function storeTweeted () {
	window.localStorage.setItem('tweeted', true);
}
