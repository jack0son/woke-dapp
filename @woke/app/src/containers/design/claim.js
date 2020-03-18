import React, { useEffect, useState } from 'react';

// View containers
import Claim from '../views/claim';
import Loading from '../views/loading';

// Dummy state 
import { useRootContext } from '../../hooks/root-context'
import useLinearStages from '../../hooks/linearstate';
import StateFlicker from '../../components/stateflicker';
import * as claimStates from '../../hooks/woke-contracts/claimuser-states';
import stageConfig from './stage-controller'


const stages = stageConfig.claim;
const { statesLabels } = claimStates;
const states = stages.byName;

export default function ClaimContainer (props) {
	const dummyClaimState = useLinearStages({stageList: stages.list, initialStage: stages.initial || states.READY});
	const {dispatchNext, dummyAsyncJob} = dummyClaimState;
	const rootContext = useRootContext();
	const [error, setError] = useState();

	// Pass claim stage up to the state selector
	useEffect(() => {
		rootContext.setEscapeHatch({
			items: stages.list,
			onChange: (event) => dummyClaimState.select(event.target.value)
		});
	}, []);

	const renderClaim = () => (
		<Claim
			claimState={{
				transactions: {
					sendClaimUser: {
					},
					sendFulfillClaim: {
					},
				},
				error: error,
				stageLabels: statesLabels,
				...dummyClaimState
			}}
			triggerPostTweet={() => dispatchNext()}
			handleTweeted={() => dispatchNext()}
			handleConfirmedTweeted={() => dispatchNext()}
		/>
	);

	const renderLoading = () => {
		//dummyAsyncJob('auth_dummy:load-complete');
		return (
			<Loading
				handleDone={() => setTimeout(() => dispatchNext('done loading'), 2000)}
			/>
		);
	};

	const stage = dummyClaimState.stageEnum[dummyClaimState.stage]; // stage string
	const chooseRender = stage != states.CLAIMED ? renderClaim : renderLoading;

	useEffect(() => {
		console.log('Claim Stage: ', stage);
		if(dummyClaimState.stage ==  states.CONFIRMED) {
			setInterval(() => {
				dispatchNext();
			}, 500);
		}
	}, [stage])

	useEffect(() => {
		if(dummyClaimState.stage == states.CLAIMED) {
			props.handleComplete();
		}

		if(dummyClaimState.stage == states.ERROR) {
			setError('Hint: Scroll down to use the state selector. Start at ready.');
		} else {
			setError(null);
		}
	}, [dummyClaimState.stage])

	return (
		<>
			{ chooseRender() }
		</>
	);
}
