const { PostgresPersistenceEngine } = require('nact-persistence-postgres');
const repo = require('./lib/repo');

function PersistenceEngine() {
	return new PostgresPersistenceEngine(repo.getConnectionString());
}

module.exports = PersistenceEngine;
