import React, { useEffect } from 'react';
import { useTheme } from '@material-ui/styles';

import Loading from './loading'
import Error from './error'
import ClaimLayout from '../../layouts/page-claim'
import FlexColumn from '../../layouts/flex-column'

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
		handleNotTweeted,
		triggerPostTweet, // if not use share intent
	} = props;

	const theme = useTheme();

	const stageMap = claimState.stageMap;
	const sc = claimState.stageMap;
	const stage = claimState.stage;
	const stageString = claimState.stageList[claimState.stage]; // stage string

	// Share intent url
	const renderTweetClaim = () => {
			const intentUrl = createShareIntentUrl(claimState.claimString);
			return (
				<ClaimLayout
					instructionText={[`To securely claim any `, <WokeSpan key="WokeSpan">WOKENs</WokeSpan>, ` you've already been sent, we need to tweet a signed message.`]}
					button={TweetButton}
					buttonProps={{
						href: intentUrl,
						onClick: handleTweeted
					}}
					buttonMessage="Don't alter the message"
				/>
			)
	};

	const renderConfirmTweeted = () => (
		<>
		<ClaimLayout
			instructionText={`Did you tweet?`}
			textAlign="center"
			buttonProps={{
				onClick: handleConfirmedTweeted,
				text: `Yes, I tweeted!`,
				color: 'primary',
			}}
		>
			<Button
				onClick={handleNotTweeted}
				text={'No'}
				styles={{
					background: theme.palette.common.black,
				}}
		/>
		</ClaimLayout>
		</>
	);

	const renderClaiming = () => (
		<Loading
			handleDone={() => {}}
		>
			<LinearProgress 
				stageList={claimState.stageList.slice(sc.CONFIRMED,sc.CLAIMED + 1)}
				labelList={claimState.stageLabels}
				stage={stage - sc.CONFIRMED}
			/>
		</Loading>
	);

	const renderError = () => (
		<Error/> //message={claimState.error}/>
	);

	
	// Subsumption tree
	let chooseRender = () => (<Loading message={'Analysing wokeness ...'}/>);
	if(stage == sc.ERROR) {
		chooseRender = renderError;
	} else if(stage == sc.CLAIMED) {
		// Shouldn't get here
		console.warn('Claim in incorrect state: ', `${stage}: ${stageString}`);
	} else if (stage >= sc.CONFIRMED) {
		chooseRender = renderClaiming;
	} else if (stage >= sc.TWEETED) {
		chooseRender = renderConfirmTweeted;
	} else if (stage >= sc.READY) {
		chooseRender = renderTweetClaim;
	} else {
		console.warn('Claim in undefined state: ', `${stage}: ${stageString}`);
	}
	const claimStatus = claimState.transactions.sendClaimUser.pending;
	const fulfillStatus = claimState.transactions.sendFulfillClaim.pending;

	return (
		<>
		{ chooseRender() }
		<FlexColumn align="center">
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
		</FlexColumn>
		</>
	);
}
	//const targetUrl = `javascript:window.open('${refUrl}', 'WOKE - Tweet claim string', 'width=500 height=300')`;
