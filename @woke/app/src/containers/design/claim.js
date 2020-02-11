import React, { useEffect } from 'react';

// View containers
import Claim from '../views/claim';
import Loading from '../views/loading';


// Dummy state 
import { useRootContext } from '../../hooks/root-context'
import useLinearStages from '../../hooks/linearstate';
import StateFlicker from '../../components/stateflicker';
import * as claimStates from '../../hooks/woke-contracts/claimuser-states';

const {statesMap, statesList, statesLabels} = claimStates;
const states = statesMap;

export default function ClaimContainer (props) {
	const dummyClaimState = useLinearStages({stageList: statesList, initialStage: states.LODGED});
	const {dispatchNext, dummyAsyncJob} = dummyClaimState;
	const rootContext = useRootContext();

	useEffect(() => {
		rootContext.setEscapeHatch({
			items: statesList,
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
	}, [dummyClaimState.stage])

	return (
		<>
			{ chooseRender() }
		</>
	);
}
