const nconf = require('nconf')
nconf.env() // Use environmental variables

const node_env = nconf.get('NODE_ENV')
switch(node_env) {
	case 'development': 
		nconf.file('defaults', 'development-config.json')
		break;
	case 'development-docker':
		nconf.file('defaults', 'development-docker-config.json')
		break;
	case 'rinkeby':
		nconf.file('defaults', 'development-config.json')
		break;
	default: 
		nconf.file('defaults', 'default-config.json')
}

module.exports = nconf
