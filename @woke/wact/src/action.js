// map(symbol => method)
const ActionDirectory = (actions) =>
	Object.keys(actions).reduce((dir, actionName) => {
		const symbol = Symbol(actionName);
		dir[symbol] = actions[actionName];
		return dir;
	}, {});

// Map(method => Symbol)
const SymbolDirectory = (actionDirectory) =>
	Object.getOwnPropertySymbols(actionDirectory).reduce((dir, symbol) => {
		dir.set(actionDirectory[symbol], symbol);
		return dir;
	}, new Map());

const buildDirectory = (actions) => {
	const actionDirectory = ActionDirectory(actions);
	return { actions: actionDirectory, symbols: SymbolDirectory(actionDirectory) };
};

module.exports = {
	ActionDirectory,
	SymbolDirectory,
	buildDirectory,
};
