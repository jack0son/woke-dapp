import React, { useEffect, useMemo } from 'react'

// View Containers
import SignIn from './views/signin'
import Loading from './views/loading'
import SetPassword from './views/setpassword'
import Login from './views/login'

// TODO move to view
import Spinner from '../components/progress/spinner-indeterminate'
import LargeBody from '../components/text/body-large'
import WokeSpan from '../components/text/span-woke'

// Hooks
import useAuthRouter, {states} from '../hooks/auth-router'
import { useTwitterContext } from '../hooks/twitter/index.js'
import useUserIsClaimed from '../hooks/woke-contracts/user-is-claimed'
import useHedgehog from '../hooks/hedgehog'


function createUserName(id) {
	if(process.env.NODE_ENV == 'development') {
	 return id;// + Math.floor(Math.random() * Math.floor(1000));
	}
	return id;// + token; 
}

// TODO fix the loading state
// TODO after signed in with twitter should check if account exists at server
export default function AuthContainer(props) {
	const {hedgehog, renderProp} = props;
	const twitterSignin = useTwitterContext().userSignin;
	const twitterSignedIn = twitterSignin.isSignedIn()

	// Initial view router state
	const router = useAuthRouter(twitterSignedIn ? states.HEDGEHOG : states.TWITTER);

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
	const renderLoading = (message) => (
		<>
		<Loading>
			<LargeBody align="center">
				{ 
					(() => {
						switch(message) {
							case 'signup': 
								return <>Generating wallet<br/>Big math, long wait ...<br/></>;
							case 'login': 
								return <>Summoning your <WokeSpan>Wokens</WokeSpan> ...<br/></>
							default: 
								return null;
						}
					})()
				}
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
	const renderFunc = renderMap[router.state] // choose render

	const userIsClaimed = useUserIsClaimed(twitterSignedIn ? twitterSignin.user.id : null);
	useEffect(() => {
		if(userIsClaimed === true) {
			console.log('Auth: Twitter user is claimed on-chain')
			router.dispatch({type: 'hedgehog-account_exists'});
		} else if(userIsClaimed === false) {
		}
	}, [userIsClaimed])

	const hedgehogPredicate = router.state === states.HEDGEHOG;
	useEffect(() => {
		if(hedgehogPredicate) {
			const savedUser = hedgehog.state.savedUser
			if (savedUser && savedUser.length > 0) {

				hedgehog.api.restoreUsername();
				console.log('dispatching hedgehog-account_exists')
				router.dispatch({type: 'hedgehog-account_exists'});
			}
		}
	},
		[
			hedgehogPredicate,
			hedgehog.state.savedUser,
			hedgehog.api.restoreUsername
		]);

	useEffect(() => {
		if(twitterSignedIn) {
			const savedUser = hedgehog.state.savedUser
			if (!(savedUser && savedUser.length > 0)) {
				hedgehog.api.setUsername(createUserName(
					twitterSignin.user.id,
					//twitterSignin.credentials.oauth_token
				));
			}

			console.log('dispatching twitter-authenticated')
			router.dispatch({type: 'twitter-authenticated'});
		} else if (false) { //twitterSignin.haveCreds()) {
			// LOGOUT
		}
	},
		[
			twitterSignedIn,
			twitterSignin.user.id,
			hedgehog.state.savedUser,
			hedgehog.api.setUsername
		])

	useEffect(() => {
		// @TODO Saved user needs to be verified on the server
		if(hedgehog.state.signedIn === true) {
			console.log('dispatching hedgehog-authenticated')
			router.dispatch({type: 'hedgehog-authenticated'});
		}
	}, [hedgehog.state.signedIn]);

	useEffect(() => {
		console.log('Auth state: ', router.state);
	}, [router.state])

	return (
		<>
		{ renderProp(router.state == 'TWITTER') }
		{hedgehog.state.loading ? renderLoading(hedgehog.state.loading) : renderFunc()}
		</>
	)
}
