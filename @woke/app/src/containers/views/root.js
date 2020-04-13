import React from 'react'

//Router
import { BrowserRouter as Switch, Route, Redirect } from 'react-router-dom';
import { Router, useParams, useLocation } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import How from '../../layouts/how/index';

// Layout
import Loading from '../views/loading';
import Theming from '../../layouts/theming';
import RootContainer from '../../layouts/container-root';
import NavBar from '../../components/navbar';

// Hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context';
import { useTwitterContext } from '../../hooks/twitter';

const history = createBrowserHistory();

function AuthResponse(props) {
	const query = useQuery();
	const { userSignin } = useTwitterContext();
	console.log('auth', query.get('oauth_token'), query.get('oauth_verifier'));

	userSignin.handleOAuthCallback();

	return (
		userSignin.isSignedIn() || userSignin.error ? <Redirect
            to={{
              pathname: "/",
              state: {}
            }}
		/> : <Loading/>
	);
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function RootView({children}) {
	const { loading, headerChildren } = useRootContext();

	const makeNavBar = () => (
		<NavBar
			hideNavItems={loading}
		/>
	);

	return (
		<Theming>
			<RootContainer NavBar={makeNavBar()} headerChildren={headerChildren}>
				<Router history={history}>
					<Switch>
						<Route exact path='/'>{children}</Route>
						<Route exact path='/How' component={How} />
						<Route path='/oauth_twitter'><AuthResponse/></Route>
					</Switch>
				</Router>
			</RootContainer>
		</Theming>
	);
}
