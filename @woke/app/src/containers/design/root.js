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
const AUTH = 'AUTH';
const WEB3 = 'WEB3';
const stageList = [AUTH, WEB3];

// For deployment
// Set container paths to _stateDir/<containerpath>

export default function RootContainer() {
	const [claimComplete, setClaimComplete] = useState(false);

	const dummyState = useLinearStages({stageList, initialStage: 1});

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
			hideLogo={stage == WEB3 ? false : true}
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
