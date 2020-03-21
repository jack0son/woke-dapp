import React from 'react';

// Logical containers
import Authentication from './authentication'
import Web3Initializer from './web3-initializer'

// View containers
import Root from '../views/root'
import { RootContextProvider } from '../../hooks/root-context'
import { DesignContextProvider } from '../../hooks/design/design-context'
import useDesignDomain from '../../hooks/design/use-domain'

// Dummy state 
import useLinearStages from '../../hooks/fsm-linear'
import StageOverlay from '../../components/design/stage-overlay'
import StageSelector from '../../components/design/stage-selector'
import stageConfig from './stages';


const stages = stageConfig.root;

export default function RootContainer() {
	const dummyState = useLinearStages({stageList: stages.list, initialStage: stages.initial ||  stages.byName.AUTH });

	// useDesignContext must be called inside design context
	function RegisterRootDomain() {
		useDesignDomain({ domainName: 'root', linearStages: dummyState, stages });
		return null;
	}

	const renderAuth = () => (
		<Authentication
			handleAuthComplete={dummyState.dispatchNext}
		/>
	);

	const renderWeb3 = () => (
		<Web3Initializer
			wallet="dummywallet"
		/>
	);

	const renderMap = {
		AUTH: renderAuth,
		WEB3: renderWeb3,
	};

	const stage = dummyState.stageEnum[dummyState.stage]; // stage string
	const chooseRender = renderMap[stage];

	return (
		<RootContextProvider>
			<DesignContextProvider>
				<Root>
					<RegisterRootDomain/>
					{ chooseRender() }
				</Root>

				<StageOverlay >
					<StageSelector domainName={'root'}/>
					<StageSelector domainName={'authentication'}/>
					<StageSelector domainName={'claim'}/>
				</StageOverlay>

			</DesignContextProvider>
		</RootContextProvider>
	);
}
