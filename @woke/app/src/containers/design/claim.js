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
	const { handleClaimComplete } = props;

	const claimState = useLinearStages({
		stageList: stages.list,
		initialStage: stages.initial || states.READY,
		handleLastStage: handleClaimComplete,
	});
	useDesignDomain({									// Pass claim stage up to the state selector
		domainName: 'claim',
		linearStages: claimState,
		stages,
	});

	const { dispatchNext, dummyOnChangeEvent } = claimState;
	const [error, setError] = useState();
	const [claiming, setClaiming] = useState(false);


	const handleConfirmedTweeted = () => {
		setClaiming(true);							// Simulate web3 claim process
		dispatchNext();
	}

	const renderLoading = () => <Loading/>;
	const renderClaim = () => <Claim
			claimState={{
				transactions: {
					sendClaimUser: {
					},
					sendFulfillClaim: {
					},
				},
				error: error,
				stageLabels: statesLabels,
				...claimState
			}}
			triggerPostTweet={() => dispatchNext()}
			handleTweeted={() => dispatchNext()}
			handleConfirmedTweeted={handleConfirmedTweeted}
	/>;

	const chooseRender = claimState.stage != stages.byName.CLAIMED ? renderClaim : renderLoading;

	useEffect(() => {
		const stageString = claimState.stageEnum[claimState.stage]; // stage string
		console.log('Claim Stage: ', stageString);
		if(claiming && claimState.stage >= stages.byName.CONFIRMED && claimState.stage < stages.byName.CLAIMED) {
			dummyOnChangeEvent(700);
		}
	}, [claimState.stage])

	useEffect(() => {
		if(claimState.stage == states.CLAIMED) {
			setTimeout(handleClaimComplete, 1000);
		}

		if(claimState.stage == states.ERROR) {
			setError('Hint: State overlay lets you flick everywhere. Hooray!');
		} else {
			setError(null);
		}
	}, [claimState.stage])

	return (
		<>
			{ chooseRender() }
		</>
	);
}
