import React, { useEffect } from 'react';

// Container view
import SignIn from '../views/signin'
import Loading from '../views/loading'
import SetPassword from '../views/setpassword'
import Login from '../views/login'

// Dummy state 
import useDesignDomain from '../../hooks/design/use-domain'
import useLinearStages from '../../hooks/fsm-linear'
import stageConfig from './stages'
import { useIsMounted } from '../../hooks/util-hooks';


const stages = stageConfig.authentication;

export default function AuthContainer (props) {
	const dummyState = useLinearStages({stageList: stages.list, initialStage: stages.initial || stages.byName.SIGNIN });
	const {dispatchNext, dummyOnChangeEvent } = dummyState;

	useDesignDomain({
		domainName: 'authentication',
		linearStages: dummyState,
		stages,
	});

	const renderSignin = () => (
		<SignIn
			triggerSignIn={dispatchNext}
		/>
	);

	const RenderLoading = () => {
		const isMounted = useIsMounted();
		dummyOnChangeEvent( { value: 'auth_dummy:load-complete' }, isMounted, 3750);
		return (
			<Loading/>
		)
	};

	const renderSetPassword = () => (
		<SetPassword
			triggerSetPassword={dispatchNext}
		/>
	);

	const renderLogin = () => (
		<Login
			handleLogin={dispatchNext}
		/>
	);

	const renderMap = {
		SIGNIN: renderSignin,
		LOADING: () => null,
		SETPASSWORD: renderSetPassword,
		LOGIN: renderLogin,
		AUTHD: () => (<Loading/>),
	};

	const stage = dummyState.stageEnum[dummyState.stage]; // stage string
	const chooseRender = renderMap[stage];

	useEffect(() => {
		console.log('Stage: ', stage);
		if(stage == stages.AUTHD) {
			props.handleAuthComplete();
		}
	}, [stage])

	return (
		<>
			{
				dummyState.stage == stages.byName.LOADING ? <RenderLoading/> : chooseRender()
			}
		</>
	);
}
