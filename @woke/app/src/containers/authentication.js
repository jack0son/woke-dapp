import React, { useEffect, useMemo } from 'react'

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
import { useTwitterContext } from '../hooks/twitter/index.js'
import useHedgehog from '../hooks/hedgehog'

function createUserName(id, token) {
	if(process.env.NODE_ENV == 'development') {
	 return id + token + Math.floor(Math.random() * Math.floor(1000));
	}
	return id;// + token; 
}

// TODO fix the loading state
export default function AuthContainer(props) {
	const {hedgehog, renderProp} = props;
	const twitterSignin = useTwitterContext().userSignin;

	// Initial view router state
	const router = useAuthRouter(twitterSignin.isSignedIn() ? states.HEDGEHOG : states.TWITTER);

	const renderSignInWithTwitter = () => (
		<SignIn
			triggerSignIn={twitterSignin.handleStartAuth}
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

	useEffect(() => {
		if(twitterSignin.isSignedIn()) {
			const savedUser = hedgehog.state.savedUser
			if (!(savedUser && savedUser.length > 0)) {
				hedgehog.api.setUsername(createUserName(
					twitterSignin.user.id,
					twitterSignin.credentials.oauth_token
				));
			}

			console.log('dispatching twitter-authenticated')
			router.dispatch({type: 'twitter-authenticated'});
		} else if (twitterSignin.haveCreds()) {
			// LOGOUT
		}
	}, [twitterSignin.isSignedIn()])

	useEffect(() => {
		// @TODO Saved user needs to be verified on the server
		if(hedgehog.state.signedIn === true) {
			console.log('dispatching hedgehog-authenticated')
			router.dispatch({type: 'hedgehog-authenticated'});
		}
	}, [hedgehog.state.signedIn]);

	const renderFunc = renderMap[router.state] // choose render

	return (
		<>
		{ renderProp(router.state == 'TWITTER') }
		{hedgehog.state.loading ? renderLoading() : renderFunc()}
		</>
	)
}
