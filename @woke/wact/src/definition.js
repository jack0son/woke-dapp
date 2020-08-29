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
	adaptCompose(definition, actions, properties);

function adaptCompose(definition, _actions, _properties, opts = {}) {
	const { labeling } = opts;
	const receivers = [
		...((definition.properties && definition.properties.receivers) || []),
		...((_properties && _properties.receivers) || []),
	];

	const Receivers = (bundle) =>
		receivers.reduce((R, receiver) => {
			R[receiver.name] = receiver(bundle);
			return R;
		}, {});

	const actions = labelActions({ ..._actions, ...definition.actions }, labeling);

	// Values from definition take precedence
	const properties = merge(_properties, {
		...definition.properties,
		Receivers,
		receivers,
	});

	return Object.assign(definition, { actions, properties });
}

module.exports = { MakeDefinition, adapt, adaptCompose };
