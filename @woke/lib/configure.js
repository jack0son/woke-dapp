const merge = require('./merge');

const configure = (options, defaults) => merge(defaults, options);

module.exports = configure;
