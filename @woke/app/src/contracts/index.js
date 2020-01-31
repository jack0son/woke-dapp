//const artifacts = require('@woke/contracts');
// @TODO fix this mess
const dir = process.env.REACT_APP_ETH_NETWORK ?
	(process.env.REACT_APP_ETH_NETWORK == 'rinkeby' ? 'production' : 'development')
	: (process.env.NODE_ENV == 'production' ? 'production' : 'development')
	
const wokeTokenPath = `./${dir}/WokeToken.json`;
const twitterOracleMockPath = `./${dir}/TwitterOracleMock.json`;

const useDevContracts = process.env.REACT_APP_ETH_NETWORK == 'development'

const WokeToken = (useDevContracts && require('./development/WokeToken.json')) || require('./production/WokeToken.json')
const TwitterOracleMock = (useDevContracts && require('./development/TwitterOracleMock.json')) || require('./production/TwitterOracleMock.json')

module.exports = {
	WokeToken,
	TwitterOracleMock,
}
