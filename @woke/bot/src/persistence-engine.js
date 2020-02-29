const { PostgresPersistenceEngine } = require('nact-persistence-postgres');
const repo = require('./lib/repo');
const debug = require('@woke/lib').Logger('persistence');

function PersistenceEngine() {
	const conn = repo.getConnectionString();
	debug.info(`Connection string: ${conn}`);
	const pEngine = new PostgresPersistenceEngine(conn);
	//console.log('persistenceEngine', pEngine);
	return pEngine;
}

module.exports = PersistenceEngine;
