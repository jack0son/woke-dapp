const merge = require('./merge');

const configure = (options, defaults, mergeOptions) =>
	merge(defaults, options, mergeOptions);

module.exports = configure;
