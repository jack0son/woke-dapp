import React from 'react';

import LogicRoot from './containers/root'
// TODO unecessary import for build - bloat
import DesignRoot from './containers/design/root'

const Root = (process.env.REACT_APP_DEV_MODE == 'design') ? DesignRoot : LogicRoot;

function App() {
	return (
		<div className="App">
			<header className="App-header">
			</header>
				<Root/>
		</div>
	);
}

export default App;
