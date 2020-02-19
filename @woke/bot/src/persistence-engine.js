const { PostgresPersistenceEngine } = require('nact-persistence-postgres');
const repo = require('./lib/repo');

function PersistenceEngine() {
	return PostgresPersistenceEngine(repo.getConnectionString());
}

module.exports = PersistenceEngine;
