const actions = require('./actions');
const Properties = require('./properties');
const Definition = require('@woke/wact').MakeDefinition(() => actions, Properties);

module.exports = { Definition, Properties, actions };
