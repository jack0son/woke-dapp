import React from 'react';

import LogicRoot from './containers/root'
// TODO unecessary import for build - bloat
import DesignRoot from './containers/design/root';
import { RouterContextProvider } from './hooks/router-context';

//const Root = LogicRoot;
//const Root = DesignRoot;
const Root = (process.env.REACT_APP_DEV_MODE == 'design') ? DesignRoot : LogicRoot;

function App() {
	return (
		<div className="App">
			<header className="App-header">
			</header>
			<RouterContextProvider>
				<Root/>
			</RouterContextProvider>
		</div>
	);
}

export default App;
