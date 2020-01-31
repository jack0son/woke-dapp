//const artifacts = require('@woke/contracts');
const dir = process.env.NODE_ENV == 'production' ? 'production' : 'development';
const wokeTokenPath = `./${dir}/WokeToken.json`;
const twitterOracleMockPath = `./${dir}/TwitterOracleMock.json`;

module.exports = {
	WokeToken: require(wokeTokenPath),
	TwitterOracleMock: require(twitterOracleMockPath),
}
