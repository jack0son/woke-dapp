import React, { useState } from 'react';

// Logical containers
import Authentication from './authentication'
import Web3Initializer from './web3-initializer'

// View containers
import Root from '../views/root'
import { RootContextProvider, useRootContext } from '../../hooks/root-context'

// Dummy state 
import useLinearStages from '../../hooks/linearstate'
import StateFlicker from '../../components/stateflicker'
import StateSelector from '../../components/state-selector'
import stageConfig from './stage-controller';

console.log(stageConfig);

const stages = stageConfig.root;

// For deployment
// Set container paths to _stateDir/<containerpath>

export default function RootContainer() {
	const [claimComplete, setClaimComplete] = useState(false);

	const dummyState = useLinearStages({stageList: stages.list, initialStage: stages.initial ||  0});

	const dispatchNext = (event) => {
		dummyState.dispatch({type: 'NEXT'});
	}

	const renderAuth = () => (
		<Authentication
			handleAuthComplete={dispatchNext}
		/>
	);

	const renderWeb3 = () => (
		<Web3Initializer
			wallet="dummywallet"
		/>
	);

	const renderMap = {
		AUTH: renderAuth,
		WEB3: renderWeb3
	}

	const stage = dummyState.stageEnum[dummyState.stage]; // stage string
	const chooseRender = renderMap[stage];

	return (
		<RootContextProvider>
		<Root
			hideLogo={stage == stages.byName.WEB3 ? false : true}
		>
			{ chooseRender() }
		</Root>

		<StateFlicker
			dispatch={dummyState.dispatch}
			stageString={stage}
		/>
			<StateSelector/>
		</RootContextProvider>
	);
}
