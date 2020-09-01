const { labelActions } = require('./action');
const { merge } = require('./lib/utils');

function MakeDefinition(Actions, Properties) {
	function Definition(actionArgs, propertyArgs = [], ...properties) {
		return {
			actions: Actions(...actionArgs),
			properties: Properties(...propertyArgs.concat(properties)),
		};
	}
	Definition.prototype.Actions = Actions;
	Definition.prototype.Properties = Properties;

	return Definition;
}

const adapt = (definition, { actions, properties }) =>
	compose(definition, actions, properties);

function compose(definition, _actions, _properties, opts = {}) {
	const { labeling } = opts;
	const receivers = [
		...((definition.properties && definition.properties.receivers) || []),
		...((_properties && _properties.receivers) || []),
	];

	const actions = labelActions(merge(_actions, definition.actions), labeling);

	// Values from definition take precedence
	const properties = merge(_properties, {
		...definition.properties,
		receivers,
	});

	// console.log(Receivers({}));
	// console.log(receivers);

	return Object.assign(definition, { actions, properties });
}

module.exports = { MakeDefinition, adapt, compose };
