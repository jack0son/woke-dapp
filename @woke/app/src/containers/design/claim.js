import React, { useEffect, useState } from 'react';

// View containers
import Claim from '../views/claim';
import Loading from '../views/loading';

// Dummy state 
import { useDesignContext } from '../../hooks/design/use-domain'
import useDesignDomain from '../../hooks/design/use-domain'
import useLinearStages from '../../hooks/fsm-linear';
import * as claimStates from '../../hooks/woke-contracts/claimuser-states';
import stageConfig from './stages'


const stages = stageConfig.claim;
const { statesLabels } = claimStates;
const states = stages.byName;

export default function ClaimContainer (props) {
	const dummyClaimState = useLinearStages({stageList: stages.list, initialStage: stages.initial || states.READY});
	const {dispatchNext, dummyAsyncJob} = dummyClaimState;
	const [error, setError] = useState();

	// Pass claim stage up to the state selector
	useDesignDomain({
		domainName: 'claim',
		linearStages: dummyClaimState,
		stages,
	});

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

	const renderLoading = () => <Loading/>

	const stage = dummyClaimState.stageEnum[dummyClaimState.stage]; // stage string
	const chooseRender = stage != states.CLAIMED ? renderClaim : renderLoading;

	useEffect(() => {
		console.log('Claim Stage: ', stage);
		if(dummyClaimState.stage >= stages.byName.CONFIRMED && dummyClaimState.stage < stages.byName.CLAIMED) {
			dummyClaimState.dummyOnChangeEvent(1000);
		}
	}, [stage])

	useEffect(() => {
		if(dummyClaimState.stage == states.CLAIMED) {
			props.handleComplete();
		}

		if(dummyClaimState.stage == states.ERROR) {
			setError('Hint: State overlay lets you flick everywhere. Hooray!');
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
