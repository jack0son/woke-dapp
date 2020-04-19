import React from 'react';

// Logical containers
import Authentication from './authentication'
import Web3Initializer from './web3-initializer'

// Context
import { RootContextProvider, useRootContext } from '../../hooks/root-context'
import { DesignContextProvider, useDesignContext } from '../../hooks/design/design-context'
import { useRouterContext } from '../../hooks/router-context'

// View containers
import Loading from '../views/loading'
import RootView from '../views/root'


import { Redirect } from 'react-router-dom';
import useDesignDomain from '../../hooks/design/use-domain'

// Dummy state 
import useLinearStages from '../../hooks/fsm-linear'
import StageOverlay from '../../components/design/stage-overlay'
import StageSelector from '../../components/design/stage-selector'
import stageConfig from './stages';


const stages = stageConfig.root;

// Access root context
function UseRootContext({ linearStages, }) {
	useDesignDomain({ domainName: 'root', linearStages, stages });
	const { setTwitterAuth } = useRootContext();
	const { twitterAuth } = useDesignContext();
	setTwitterAuth(twitterAuth); //  set the signed in state getter

	return null;
}

// Access design context
function UseDesignContext({ twitterSignedIn }) {
	return null;
}

export default function RootContainer() {
	const { history } = useRouterContext();
	const dummyState = useLinearStages({stageList: stages.list, initialStage: stages.initial ||  stages.byName.AUTH });

	const handleLogin = () => {
		history.push('/');
		setLoggedIn(true);
		dummyState.dummyOnChangeEvent();
	}

	const [loggedIn, setLoggedIn] = React.useState(false);
	const hedgehogDummy = {
		state: { loggedIn },
		api: {
			handleLogin,
			setPassword: () => true,
			login: () => { console.log('hedgehog: login'); setLoggedIn(true) },
			logout: () => { console.log('hedgehog: logout'); setLoggedIn(false) },
		},
	}

	React.useEffect(() => {
		if(dummyState.stage == stages.byName.WEB3 && !hedgehogDummy.state.loggedIn) {
			dummyState.select('AUTH');
		}
	}, [hedgehogDummy.state.loggedIn])

	const renderAuth = () => (
		<Authentication
			hedgehog={hedgehogDummy}
			handleAuthComplete={dummyState.dispatchNext}
		/>
	);

	const renderWeb3 = () => (
		<Web3Initializer
			wallet={hedgehogDummy}
		/>
	);

	const twitterAuthComponent = () => {
		dummyState.dummyOnChangeEvent();
		return <Loading/>
	}

	const renderMap = {
		AUTH: renderAuth,
		WEB3: renderWeb3,
	};

	const stage = dummyState.stageEnum[dummyState.stage]; // stage string
	const chooseRender = renderMap[stage];

	return (
		<RootContextProvider hedgehog={hedgehogDummy}>
			<DesignContextProvider>
				<UseRootContext
					linearStages={dummyState}
					styles={{
						rootContainer: {
							gutterSizeP: 10,
						}
					}}
				/>
				<RootView TwitterAuth={twitterAuthComponent}>
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
