//const artifacts = require('@woke/contracts');
// @TODO fix this mess
const useDevContracts = process.env.REACT_APP_ETH_NETWORK == 'development'
const UserRegistry = (useDevContracts && require('./development/UserRegistry.json')) || require('./production/UserRegistry.json')
const WokeToken = (useDevContracts && require('./development/WokeToken.json')) || require('./production/WokeToken.json')
const TwitterOracleMock = (useDevContracts && require('./development/TwitterOracleMock.json')) || require('./production/TwitterOracleMock.json')

module.exports = {
	UserRegistry,
	WokeToken,
	TwitterOracleMock,
}
