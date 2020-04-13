import React from 'react';

// Logical containers
import Authentication from './authentication'
import Web3Initializer from './web3-initializer'

// View containers
import RootView from '../views/root'
import { RootContextProvider } from '../../hooks/root-context'
import { DesignContextProvider } from '../../hooks/design/design-context'
import useDesignDomain from '../../hooks/design/use-domain'
import Loading from '../views/loading'

// Dummy state 
import useLinearStages from '../../hooks/fsm-linear'
import StageOverlay from '../../components/design/stage-overlay'
import StageSelector from '../../components/design/stage-selector'
import stageConfig from './stages';


const stages = stageConfig.root;

function UseRootContext({ linearStages }) {
	useDesignDomain({ domainName: 'root', linearStages, stages });
	return null;
}

export default function RootContainer() {
	const dummyState = useLinearStages({stageList: stages.list, initialStage: stages.initial ||  stages.byName.AUTH });

	// useDesignContext must be called inside design context

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

	const twitterAuth = () => {
		dummyState.dummyOnChangeEvent();
		return <Loading/>
	}

	const [loggedIn, setLoggedIn] = React.useState(true);
	const hedgehogDummy = {
		state: { signedIn: loggedIn },
		api: {
			logout: () => setLoggedIn(false),
		},
	}

	return (
		<RootContextProvider hedgehog={hedgehogDummy}>
			<DesignContextProvider>
				<RootView TwitterAuth={twitterAuth}>
					<UseRootContext
						linearStages={dummyState}
						styles={{
							rootContainer: {
								gutterSizeP: 10,
							}
						}}
					/>
					{ chooseRender() }
				</RootView>

				<StageOverlay >
					<StageSelector domainName={'root'}/>
					<StageSelector domainName={'authentication'}/>
					<StageSelector domainName={'claim'}/>
				</StageOverlay>

			</DesignContextProvider>
		</RootContextProvider>
	);
}
