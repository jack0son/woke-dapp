const nconf = require('nconf')
nconf.env() // Use environmental variables

const node_env = nconf.get('NODE_ENV')
if(node_env == 'development') {
	nconf.file('defaults', 'development-config.json')
} else if (node_env == 'ropsten') {
	nconf.file('defaults', 'development-config.json')
} else if (node_env == 'rinkeby') {
	nconf.file('defaults', 'development-config.json')
} else {
	nconf.file('defaults', 'default-config.json')
}

module.exports = nconf
