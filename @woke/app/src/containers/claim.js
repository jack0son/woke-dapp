import React, {useState, useEffect} from 'react'

// View containers
import Claim from './views/claim'

// Custom hooks
import useClaimUser from '../hooks/woke-contracts/claimuser'


export default function ClaimContainer(props) {
	const [tweetedClaimString, setTweetedClaimString] = useState(retrieveTweeted());
	const claim = useClaimUser({
		userId: props.userId,
		userHandle: props.userHandle,
	});

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

function retrieveClaimed () {
	const claimed = window.localStorage.getItem('claimed')
	if(claimed == undefined || claimed == null || !claimed) {
		return false;
	}
	return claimed;
}

/*
function storeClaimed () {
	window.localStorage.setItem('claimed', true);
}

function storeTweeted () {
	window.localStorage.setItem('tweeted', true);
}
*/
