import React from 'react';
import { Redirect } from 'react-router-dom';

import { useRootContext } from '../hooks/root-context';
import Login from './views/login';


export default function LoginContainer() {
	const { hedgehog, twitterAuth } = useRootContext();
	console.log(twitterAuth);

	// @brokenwindow twitter auth attached after render (should be pre-draw
	// effect)
	const authAttached = twitterAuth !== undefined && twitterAuth !== null;

	return authAttached ? (
		twitterAuth.isSignedIn() ? 
			<Login
				handleLogin={hedgehog.api.handleLogin}
				setPassword={hedgehog.api.setPassword}
				errorMessage={hedgehog.state.errorMessage}
				loading={hedgehog.state.loading}
			/>  :
			<Redirect
				to={{
					pathname: "/",
					state: { authError: 'not signed in to twitter' } // unused
				}}
			/>
	) : null;
}

