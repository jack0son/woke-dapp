const tweeter = require('./actors/tweeter');
const MonitorSystem = require('./systems/monitor-twitter');

module.exports = {
	tweeter,
	MonitorSystem,
	//create_contracts_system: require('./actors/contracts-system'),
};
