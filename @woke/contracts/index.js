const production = {
	WokeToken: require('./production/WokeToken.json'),
	TwitterOracleMock: require('./production/TwitterOracleMock.json'),
}

// Will cause create-react-app webpack to fail
// No dynamic require (Issue #__);
let development;
if(process.env.NODE_ENV !== 'production') {
	development = {
		WokeToken: require('./development/WokeToken.json'),
		TwitterOracleMock: require('./development/TwitterOracleMock.json'),
	};
}

module.exports = {
	production,
	development,
}
