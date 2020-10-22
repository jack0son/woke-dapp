function suppressMethods(stream, methodNames = ['log', 'error', 'warn']) {
	methodNames.forEach((key) => {
		stream[key] = () => {};
	});
}

module.exports = suppressMethods;
