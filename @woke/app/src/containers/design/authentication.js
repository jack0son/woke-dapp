import React, { useEffect } from 'react';

// Container view
import SignIn from '../views/signin'
import Loading from '../views/loading'
import SetPassword from '../views/setpassword'
import Login from '../views/login'

// Dummy state 
import useLinearStages from '../../hooks/linearstate'
import StateFlicker from '../../components/stateflicker'
import initialStates from './stage-controller'


const stageList = ['SIGNIN', 'LOADING', 'SETPASSWORD', 'LOGIN', 'AUTHD'];
const stages = {};
stageList.forEach((stage, i) => stages[stage] = i);

export default function AuthContainer (props) {
	const dummyState = useLinearStages({stageList, initialStage: stages.SIGNIN});
	const {dispatchNext, dummyAsyncJob} = dummyState;

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
