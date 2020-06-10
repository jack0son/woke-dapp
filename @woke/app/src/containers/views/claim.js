import React, { useEffect } from 'react';
import { useTheme } from '@material-ui/styles';
import { useMediaQuery } from "@material-ui/core";

import Loading from './loading'
import Error from './error'
import ClaimPage from '../../layouts/page-claim'

import TweetButton from '../../components/buttons/button-tweet'
import StandardBody from '../../components/text/body-standard'
import Button from '../../components/buttons/button-contained'
import WokeSpan from '../../components/text/span-woke'
import LinearProgress from '../../components/progress/linear-stages'

import useTxTimer from '../../hooks/woke-contracts/tx-timer';

// @fix shouldn't need this whole library
// Need widget so that tweet intent works as popup
//import { Share, Tweet } from 'react-twitter-widgets';  // NB: necessary import

import useIsMobile from '../../hooks/is-mobile';
import { createShareIntentUrl, popupCenter } from '../../lib/utils';


export default function ClaimView (props) {
	const {
		claimState, 
		handleTweeted,
		handleConfirmedTweeted,
		handleNotTweeted,
		triggerPostTweet, // if not use share intent
	} = props;
	const theme = useTheme();
	const isMobile = useIsMobile();

	const sc = claimState.stageMap;
	const stage = claimState.stage;
	const stageString = claimState.stageList[claimState.stage]; // stage string

	const tweetInstruction = () => (<>
		To securely claim any <WokeSpan key="WokeSpan">WOKENs</WokeSpan> you've already been sent, we need to tweet a proof message. <br/><br/>
			<StandardBody color='primary' styles={{
				fontSize: '1.5rem',
				//color: theme.palette.error.main,
			}}>
			You can delete the tweet once your account is created
			</StandardBody>
		</>);



	// Share intent url
	const renderTweetClaim = () => {
		const intentUrl = createShareIntentUrl(claimState.claimString, true);

		const tweetClicked = () => {
			if(!isMobile) popupCenter(intentUrl, 'Proof Tweet', 500, 350);
			handleTweeted();
		}

		return (
			<ClaimPage
				//instructionText={[`To securely claim any `, <WokeSpan key="WokeSpan">WOKENs</WokeSpan>, ` you've already been sent, we need to tweet a proof message.`]}
				InstructionText={tweetInstruction}
				Button={TweetButton}
				textAlign='center'
				buttonProps={{
					memeMode: true,
					target: '_blank',
					rel: 'noopener',
					href: intentUrl,
					onClick: tweetClicked,
				}}
				buttonMessage="🚨 Don't change the tweet text"
				messageColor="primary"
			>
			</ClaimPage>
		)
	};
	//<a href={intentUrl} target="_self">TWEET</a>
	//<Share target="_blank" url={''} options={{text: claimState.claimString, hashtags: 'WokeNetwork'}}/>

	const renderConfirmTweeted = () => (
		<>
			<ClaimPage
				instructionText={`Did you tweet?`}
				textAlign='center'
				flexContainerProps={{
					flexDirection: 'column !important',
					alignItems: 'stretch !important',
				}}
				buttonProps={{
					onClick: handleConfirmedTweeted,
					textAlign: 'center',
					text: `Yes, I tweeted!`,
					color: 'primary',
				}}
			>
				<Button
					onClick={handleNotTweeted}
					text={'No, I did not tweet'}
					styles={{
						alignSelf: 'center',
						background: theme.palette.common.black,
						textAlign: 'center',
						width: 'inherit',
					}}
				/>
			</ClaimPage>
		</>
	);

	const expectedClaimTime = 60000;
	const timer = useTxTimer(expectedClaimTime, {steps: Math.floor(expectedClaimTime/100)});

	useEffect(() => {
		if(stage >= sc.FOUND_TWEET) {
			timer.start();
		}
	}, [stage]);

	const renderClaiming = () => (
		<Loading
			handleDone={() => {}}
		>
			<LinearProgress 
				stageList={claimState.stageList.slice(sc.CONFIRMED,sc.CLAIMED + 1)}
				labelList={claimState.stageLabels}
				stage={stage - sc.CONFIRMED}
				bufferEnd={timer.transferTime}
				bufferValue={timer.value}
			/>
		</Loading>
	);

	const renderError = () => (
		<Error message={claimState.error}/>
	);

	// Subsumption tree
	let chooseRender = () => (<Loading message={'Analysing wokeness ...'}/>);
	if(stage === sc.ERROR) {
		chooseRender = renderError;
	} else if(stage === sc.CLAIMED) {
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
	
	// @TODO use transaction status
	//const claimStatus = claimState.transactions.sendClaimUser.pending;
	//const fulfillStatus = claimState.transactions.sendFulfillClaim.pending;

	return (<>
		{ chooseRender() }
	</>);
}
//const targetUrl = `javascript:window.open('${refUrl}', 'WOKE - Tweet claim string', 'width=500 height=300')`;
