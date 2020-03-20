import React, { useEffect } from 'react';

// Container view
import SignIn from '../views/signin'
import Loading from '../views/loading'
import SetPassword from '../views/setpassword'
import Login from '../views/login'

// Dummy state 
import { useDesignContext } from '../../hooks/design/design-context'
import useLinearStages from '../../hooks/linearstate'
import StateFlicker from '../../components/state-flicker'
import stageConfig from './stages'


const stages = stageConfig.authentication;


export default function AuthContainer (props) {
	const dummyState = useLinearStages({stageList: stages.list, initialStage: stages.initial || stages.byName.SIGNIN });
	const {dispatchNext, dummyAsyncJob} = dummyState;
	const designContext = useDesignContext();

	// Pass auth stage up to the state selector
	useEffect(() => {
		designContext.registerDomain({
			name: 'authentication',
			options: stages.list,
			select: dummyState.select,
		})
		return () => {
			designContext.deregisterDomain('authentication');
		};
	}, []);

	const renderSignin = () => (
		<SignIn
			triggerSignIn={dispatchNext}
		/>
	);

	const renderLoading = () => {
		dummyAsyncJob('auth_dummy:load-complete', 3750);
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

	const failure = () => (
		<div>failure</div>
	);

	const renderMap = {
		SIGNIN: renderSignin,
		LOADING: renderLoading,
		SETPASSWORD: renderSetPassword,
		LOGIN: renderLogin,
		AUTHD: renderLoading,
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
			{ chooseRender() }
		</>
	);
}
