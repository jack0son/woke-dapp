import React from 'react';
import { Redirect } from 'react-router-dom';

import { useRootContext } from '../hooks/root-context';
import { useTwitterContext } from '../hooks/twitter';

import Login from './views/login';
import Loading from './views/loading';


export default function LoginContainer() {
	const { hedgehog } = useRootContext();
	const { userSignin } = useTwitterContext();

	// @brokenwindow twitter auth attached after render (should be pre-draw
	// effect)
	const authAttached = userSignin !== undefined && userSignin !== null;
	hedgehog.api.restoreUsername();

	return hedgehog.state.loggedIn || !userSignin.haveUser() ? <Redirect to="/"/>
		: hedgehog.state.loading ? <Loading/>
		: <Login
				handleLogin={hedgehog.api.handleLogin}
				setPassword={hedgehog.api.setPassword}
				errorMessage={hedgehog.state.errorMessage}
				loading={hedgehog.state.loading}
			/>
}

