//const artifacts = require('@woke/contracts');
// @TODO fix this mess
const environments = ['production', 'development', 'staging'];
const ethNetwork = process.env.REACT_APP_ETH_NETWORK;
const env = ethNetwork || process.env.NODE_ENV;
const contractEnv = environments.includes(env) ? env : 'development';
const useDevContracts = ethNetwork === 'development';
const UserRegistry =
	(useDevContracts && require('./development/UserRegistry.json')) ||
	require(`./${contractEnv}/UserRegistry.json`);
const WokeToken =
	(useDevContracts && require('./development/WokeToken.json')) ||
	require(`./${contractEnv}/WokeToken.json`);
const TwitterOracleMock =
	(useDevContracts && require('./development/TwitterOracleMock.json')) ||
	require(`./${contractEnv}/TwitterOracleMock.json`);

module.exports = {
	UserRegistry,
	WokeToken,
	TwitterOracleMock,
};
