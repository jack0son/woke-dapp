import React from 'react'

//Router
import { BrowserRouter as Switch, Route, Redirect } from 'react-router-dom';
import { Router, useParams, useLocation } from 'react-router-dom';

// Routes
import How from '../../layouts/how/index';
import Login from '../login';

// Layout
import Theming from '../../layouts/theming';
import RootContainer from '../../layouts/container-root';
import NavBar from '../../components/navbar';

// Hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context';
import { useRouterContext } from '../../hooks/router-context';
import { useTwitterContext } from '../../hooks/twitter/index.js'


// @brokenwindow
//  View container should not be responsible for app state like twitter Auth
//  Workaround: pass TwitterAuth component from root.
export default function RootView({TwitterAuth, children}) {
	const { loading, headerChildren } = useRootContext();
	const { history } = useRouterContext();
	const { userSignin } = useTwitterContext();

	// TODO attach browser history

	const makeNavBar = () => (
		<NavBar
			hideNavItems={loading}
			twitterSignin={userSignin}
		/>
	);

	return (
		<Theming>
			<RootContainer NavBar={makeNavBar()} headerChildren={headerChildren}>
				<Router history={history}>
					<Switch>
						<Route exact path='/'>{children}</Route>
						<Route exact path='/how' component={How} />
						<Route exact path='/login'><Login twitterSignin={userSignin}/></Route>
						<Route path='/oauth_twitter'><TwitterAuth/></Route>
					</Switch>
				</Router>
			</RootContainer>
		</Theming>
	);
}
