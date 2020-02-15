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
import messages from '../constants/messages-login'


function createUserName(id) {
	if(process.env.NODE_ENV == 'development') {
	 return id;// + Math.floor(Math.random() * Math.floor(1000));
	}
	return id;// + token; 
}

// TODO fix the loading state
// TODO after signed in with twitter should check if account exists at server
export default function AuthContainer(props) {
	const {hedgehog} = props;
	const twitter = useTwitterContext();
	const twitterSignedIn = twitter.userSignin.isSignedIn()

	// Initial view router state
	const router = useAuthRouter(twitterSignedIn ? states.HEDGEHOG : states.TWITTER);

	const renderSignInWithTwitter = () => (
		<SignIn
			triggerSignIn={twitter.userSignin.handleStartAuth}
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
								return <>Blessing your <WokeSpan>Wokens</WokeSpan> ...<br/></>
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

	const userIsClaimed = useUserIsClaimed(twitterSignedIn ? twitter.userSignin.user.id : null);
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
		if(hedgehog.state.errorMessage == messages.exists) {
				router.dispatch({type: 'hedgehog-account_exists'});
		}
	}, [hedgehog.state.errorMessage])

	useEffect(() => {
		if(twitterSignedIn) {
			twitter.userList.addId(twitter.userSignin.user.id);

			const savedUser = hedgehog.state.savedUser
			if (savedUser && savedUser.length > 0) {
				router.dispatch({type: 'hedgehog-account_exists'});
			} else {
				hedgehog.api.setUsername(createUserName(
					twitter.userSignin.user.id,
					//twitter.userSignin.credentials.oauth_token
				));
				console.log('dispatching twitter-authenticated')
				router.dispatch({type: 'twitter-authenticated'});
			}
		}
	},
		[
			twitterSignedIn,
			twitter.userSignin.user.id,
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
		{hedgehog.state.loading ? renderLoading(hedgehog.state.loading) : renderFunc()}
		</>
	)
}
