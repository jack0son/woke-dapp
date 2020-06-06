const production = {
	WokeToken: require('./production/WokeToken.json'),
	TwitterOracleMock: require('./production/TwitterOracleMock.json'),
	UserRegistry: require('./production/UserRegistry.json'),
}

// Will cause create-react-app webpack to fail
// No dynamic require (Issue #__);
let development;
if(process.env.NODE_ENV !== 'production') {
	development = {
		WokeToken: require('./development/WokeToken.json'),
		TwitterOracleMock: require('./development/TwitterOracleMock.json'),
		UserRegistry: require('./development/UserRegistry.json'),
	};
}

module.exports = {
	production,
	development,
}
