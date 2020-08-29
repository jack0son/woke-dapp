const actions = require('./actions-new');
const properties = require('./properties');
const Definition = require('@woke/wact').MakeDefinition(Actions, Properties);

module.exports = { properties, actions };
