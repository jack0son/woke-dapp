import React, { useEffect } from 'react';

// Container view
import SignIn from '../views/signin'
import Loading from '../views/loading'
import SetPassword from '../views/setpassword'
import Login from '../views/login'

// Dummy state 
import useDesignDomain from '../../hooks/design/use-domain'
import { useDesignContext } from  '../../hooks/design/design-context'
import { useTwitterContext } from  '../../hooks/design/twitter'
import useLinearStages from '../../hooks/fsm-linear'
import stageConfig from './stages'
import { useIsMounted } from '../../hooks/util-hooks';


const stages = stageConfig.authentication;

export default function AuthContainer (props) {
	const { handleAuthComplete } = props;
	const { userSignin } = useTwitterContext();
	const dummyState = useLinearStages({
		stageList: stages.list,
		initialStage: stages.initial || stages.byName.SIGNIN,
		handleLastStage: handleAuthComplete,
	});
	const { dispatchNext, dummyOnChangeEvent } = dummyState;

	useDesignDomain({
		domainName: 'authentication',
		linearStages: dummyState,
		stages,
	});

	const delayedNext = (action) => {
		dispatchNext();
		dummyOnChangeEvent(1000, {target: { value: `auth:${action}`, log: true }});//,  abortRef: isMounted });
	}

	const renderSignin = () => <SignIn triggerSignIn={() => {
		userSignin.signIn();
		delayedNext('twitter-signin');
	}}/>;
	const renderLoading = () => <Loading/>;
	const renderSetPassword = () => <SetPassword triggerSetPassword={dispatchNext}/>;
	const renderLogin = () => <Login handleLogin={() => delayedNext('woke-login')}/>;

	const renderMap = {
		SIGNIN: renderSignin, // @fix rename to SIGNIN_TWITTER
		LOADING: renderLoading,
		SETPASSWORD: renderSetPassword,
		LOGIN: renderLogin,
		AUTHD: renderLoading,
	};

	// const stageString = dummyState.stageEnum[dummyState.stage]; // stage string
	const chooseRender = renderMap[dummyState.stageEnum[dummyState.stage]];

	useEffect(() => {
		console.log('Auth Stage: ', dummyState.stageEnum[dummyState.stage]);
	}, [dummyState.stage])

	return (
		<>
			{
				chooseRender()
				//dummyState.stage == stages.byName.LOADING ? <RenderLoading/> : chooseRender()
			}
		</>
	);
}
