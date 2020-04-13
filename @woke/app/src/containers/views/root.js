import React from 'react'

//Router
import { BrowserRouter as Switch, Route, Redirect } from 'react-router-dom';
import { Router, useParams, useLocation } from 'react-router-dom';
import { createBrowserHistory } from 'history';

// Routes
import How from '../../layouts/how/index';
import TwitterAuth from '../twitter-auth';

// Layout
import Theming from '../../layouts/theming';
import RootContainer from '../../layouts/container-root';
import NavBar from '../../components/navbar';

// Hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context';

const history = createBrowserHistory();

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
						<Route path='/oauth_twitter'><TwitterAuth/></Route>
					</Switch>
				</Router>
			</RootContainer>
		</Theming>
	);
}
