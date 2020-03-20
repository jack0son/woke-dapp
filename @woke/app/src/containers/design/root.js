import React, { useState } from 'react';

// Logical containers
import Authentication from './authentication'
import Web3Initializer from './web3-initializer'

// View containers
import Root from '../views/root'
import { RootContextProvider, useRootContext } from '../../hooks/root-context'
import { DesignContextProvider, useDesignContext } from '../../hooks/design/design-context'

// Dummy state 
import useLinearStages from '../../hooks/linearstate'
import StateFlicker from '../../components/state-flicker'
import StateSelector from '../../components/state-selector'
import stageConfig from './stages';


const stages = stageConfig.root;

export default function RootContainer() {
	const [claimComplete, setClaimComplete] = useState(false);

	const dummyState = useLinearStages({stageList: stages.list, initialStage: stages.initial ||  stages.byName.AUTH });

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
			<DesignContextProvider>
				<Root
					hideLogo={stage == stages.byName.WEB3 ? false : true}
				>
					{ chooseRender() }
				</Root>

				<StateFlicker
					dispatch={dummyState.dispatch}
					stageString={stage}
				>
					<StateSelector domainName={'root'}/>
					<StateSelector domainName={'authentication'}/>
					<StateSelector domainName={'claim'}/>
				</StateFlicker>

			</DesignContextProvider>
		</RootContextProvider>
	);
}
