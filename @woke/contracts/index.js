// Will cause create-react-app webpack to fail
// No dynamic require (Issue #__);
let production, development, staging;
if (process.env.NODE_ENV !== 'production') {
	development = {
		WokeToken: require('./development/WokeToken.json'),
		TwitterOracleMock: require('./development/TwitterOracleMock.json'),
		UserRegistry: require('./development/UserRegistry.json'),
	};
	staging = {
		WokeToken: require('./staging/WokeToken.json'),
		TwitterOracleMock: require('./staging/TwitterOracleMock.json'),
		UserRegistry: require('./staging/UserRegistry.json'),
	};
} else {
	production = {
		WokeToken: require('./production/WokeToken.json'),
		TwitterOracleMock: require('./production/TwitterOracleMock.json'),
		UserRegistry: require('./production/UserRegistry.json'),
	};
}

module.exports = {
	production,
	staging,
	development,
};
