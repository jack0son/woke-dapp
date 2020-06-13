import React from 'react';
import { Redirect } from 'react-router-dom';

import { useRootContext } from '../hooks/root-context';

import Login from './views/login';
import Loading from './views/loading';


export default function LoginContainer({ twitterSignin }) {
	const { hedgehog } = useRootContext();

	// @brokenwindow twitter auth attached after render (should be pre-draw
	// effect)
	const authAttached = twitterSignin !== undefined && twitterSignin !== null;
	hedgehog.api.restoreUsername();

	return hedgehog.state.loggedIn || !authAttached || !twitterSignin.haveUser() ? <Redirect to="/"/>
		: hedgehog.state.loading ? <Loading/>
		: <Login
				handleLogin={hedgehog.api.handleLogin}
				setPassword={hedgehog.api.setPassword}
				errorMessage={hedgehog.state.errorMessage}
				loading={hedgehog.state.loading}
			/>
}

