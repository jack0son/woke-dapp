import React, { useEffect } from 'react';

import Loading from './loading'
import ClaimLayout from '../../layouts/page-claim'
import ContentWrapper from '../../layouts/wrapper-content'

import TweetButton from '../../components/buttons/button-tweet'
import Button from '../../components/buttons/button-contained'
import WokeSpan from '../../components/text/span-woke'
import StandardBody from '../../components/text/body-standard'
import LinearProgress from '../../components/progress/linear-stages'
import Spinner from '../../components/progress/spinner-indeterminate'

import { Share } from 'react-twitter-widgets';
import { createShareIntentUrl } from '../../lib/utils';


export default function ClaimView (props) {
	const {
		claimState, 
		handleTweeted,
		handleConfirmedTweeted,
		triggerPostTweet, // if not use share intent
	} = props;

	const stageMap = claimState.stageMap;
	const sc = claimState.stageMap;
	const stageString = claimState.stageList[claimState.stage]; // stage string

	// Share intent url
	const renderTweetClaim = () => {
			return (
				<ClaimLayout
					instructionText={[`To securely claim any `, <WokeSpan>WOKENs</WokeSpan>, ` you've already been sent, we need to tweet a signed message.`]}
					button={TweetButton}
					buttonProps={{
						href: createShareIntentUrl(claimState.claimString),
						onClick: handleTweeted,
					}}
					buttonMessage="Don't alter the message"
				/>
			)
	};

	const renderConfirmTweeted = () => (
		<ClaimLayout
			instructionText={<><br/><br/>Did you tweet?</>}
			textAlign="center"
			buttonProps={{
				onClick: handleConfirmedTweeted,
				text: `Yes, I tweeted!`,
				color: 'primary',
			}}
		/>
	);

	const renderClaiming = () => (
		<Loading
			handleDone={() => {}}
		>
			<LinearProgress 
				stageList={claimState.stageList.slice(sc.CONFIRMED,sc.CLAIMED + 1)}
				stage={claimState.stage - sc.CONFIRMED}
			/>
		</Loading>
	);

	
	// Subsumption tree
	let chooseRender = () => (<Loading message={' '}/>);
	if(claimState.stage >= sc.CLAIMED) {
		// Shouldn't get here
	} else if (claimState.stage >= sc.CONFIRMED) {
		chooseRender = renderClaiming;
	} else if (claimState.stage >= sc.TWEETED) {
		chooseRender = renderConfirmTweeted;
	} else if (claimState.stage >= sc.READY) {
		chooseRender = renderTweetClaim;
	} 
	const claimStatus = claimState.transactions.sendClaimUser.pending;
	const fulfillStatus = claimState.transactions.sendFulfillClaim.pending;

	return (
		<>
		{ chooseRender() }
		<ContentWrapper align="center">
			<StandardBody color="error">
			{claimState.error}
			</StandardBody>
			{
				(claimStatus && claimStatus ? 
					<Spinner/>
					: null)
			}
			{
				(fulfillStatus && fulfillStatus ? 
					<Spinner/>
					: null)
			}
		</ContentWrapper>
		</>
	);
}
	//const targetUrl = `javascript:window.open('${refUrl}', 'WOKE - Tweet claim string', 'width=500 height=300')`;
