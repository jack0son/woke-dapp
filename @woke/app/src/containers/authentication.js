import React, { useEffect } from 'react'

// View Containers
import SignIn from './views/signin'
import Loading from './views/loading'
import SetPassword from './views/setpassword'
import Login from './views/login'

// TODO move to view
import Spinner from '../components/progress/spinner-indeterminate'
import LargeBody from '../components/text/body-large'

// Hooks
import useAuthRouter, {states} from '../hooks/auth-router'
import useTwitterSignIn from '../hooks/twitter/use-user-signin'
import useHedgehog from '../hooks/hedgehog'

function createUserName(id, token) {
	if(process.env.NODE_ENV == 'development') {
	 return id + token + Math.floor(Math.random() * Math.floor(1000));
	}
	return id;// + token; 
}

// TODO fix the loading state
export default function AuthContainer(props) {
	const hedgehog = props.hedgehog;

	const twitterSignIn = useTwitterSignIn();

	const router = useAuthRouter(twitterSignIn.haveCredentials() ? states.HEDGEHOG : states.TWITTER);
	//console.log('Router state: ', router.state);

	const renderSignInWithTwitter = () => (
		<SignIn
			triggerSignIn={twitterSignIn.handleStartAuth}
		/>
	)

	// Should create the account then sign in
	const renderAccountCreation = () => (
		<SetPassword
			triggerSetPassword={hedgehog.api.handleSignup}
			setPassword={hedgehog.api.setPassword}
			errorMessage={hedgehog.state.errorMessage}
			loading={hedgehog.state.loading}
		/>
	);

	const renderAccountLogin = () => (
		<Login
			handleLogin={hedgehog.api.handleLogin}
			setPassword={hedgehog.api.setPassword}
			errorMessage={hedgehog.state.errorMessage}
			loading={hedgehog.state.loading}
		/>
	)

	// TODO replace spinner with logo animation
	const renderLoading = () => (
		<>
		<Loading>
			<LargeBody align="center">Generating wallet<br/>Big math, long wait ...<br/>
			</LargeBody>
		</Loading>
		</>
	);

	const renderMap = {
		'TWITTER': renderSignInWithTwitter,
		'HEDGEHOG': renderAccountCreation,
		'LOGIN': renderAccountLogin,
		'AUTHD': renderLoading,
	}

	useEffect(() => {
		const savedUser = hedgehog.state.savedUser
		if (savedUser && savedUser.length > 0) {

			hedgehog.api.restoreUsername();
			console.log('dispatching hedgehog-account_exists')
			router.dispatch({type: 'hedgehog-account_exists'});
		}
	}, [hedgehog.state.savedUser, router.state == 'HEDGEHOG']);

	const haveCredentials = useCallback(twitterSignIn.haveCredentials());

	useEffect(() => {
		if(twitterSignIn.haveUser() && twitterSignIn.haveCredentials()) {
			const savedUser = hedgehog.state.savedUser
			if (!(savedUser && savedUser.length > 0)) {
				hedgehog.api.setUsername(createUserName(
					twitterSignIn.user.id,
					twitterSignIn.credentials.oauth_token
				));
			}

			console.log('dispatching twitter-authenticated')
			router.dispatch({type: 'twitter-authenticated'});
		} else if (twitterSign.haveCredentials()) {
			// LOGOUT
		}
	}, [twitterSignIn.haveCredentials()])

	// TODO Saved user needs to be checked on the server

	useEffect(() => {
		if(hedgehog.state.signedIn === true) {
			console.log('dispatching hedgehog-authenticated')
			router.dispatch({type: 'hedgehog-authenticated'});
		}
	}, [hedgehog.state.signedIn]);

	const renderFunc = renderMap[router.state] // choose render

	return (
		<>
		{ props.renderProp(router.state == 'TWITTER') }
		{hedgehog.state.loading ? renderLoading() : renderFunc()}
		</>
	)
}
